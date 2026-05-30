"""
models.py — THE PERSISTED SPINE (SQLModel; works on SQLite for the demo).

Shape:
  User    1 ── many  Report          (a citizen submits reports)
  Issue   1 ── many  Report          (reports cluster into one issue/thread)
  Org     1 ── many  Issue           (an issue is routed to one responsible body)

An ISSUE *is* the thread. The first report attached to it (root_report_id) is the
"main" post; the rest are the X-style replies / "+N also reported this". The issue
carries the official lifecycle (status, deadline, operator notes); a report is just
one citizen's evidence (photo + location + that photo's AI intake result).

NOTE: no `from __future__ import annotations` here on purpose — it would turn the
Relationship() annotations into strings SQLAlchemy can't resolve. Use typing.List.

Run the demo DB:
    pip install sqlmodel && python -c "from models import init_db; init_db()"
"""

from datetime import datetime, timezone
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel, create_engine, JSON, Column

from enums import Category, IssueStatus, Severity


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    display_name: str
    phone: Optional[str] = None
    # Reputation: starts at 100. Irrelevant-photo rejections decrement it; a low
    # score throttles a user (see api note) and protects the queue from spam.
    credibility: int = Field(default=100)
    coins: int = Field(default=0)          # earned for accepted/resolved contributions
    created_at: datetime = Field(default_factory=_utcnow)

    reports: List["Report"] = Relationship(back_populates="user")


class Organization(SQLModel, table=True):
    # mirrors taxonomy.ORGS as persisted rows so the dashboard can list/edit them
    key: str = Field(primary_key=True)             # e.g. "azersu"
    name_az: str
    scope: str                                     # district | city_utility | city_service
    contact_hint: str = ""

    issues: List["Issue"] = Relationship(back_populates="org")


class Issue(SQLModel, table=True):
    """The thread + its official lifecycle. One per real-world problem."""
    id: Optional[int] = Field(default=None, primary_key=True)

    # classification (AI-proposed, operator-confirmed)
    category: Category = Field(index=True)
    severity: Severity = Field(default=Severity.MEDIUM)
    title_az: str = ""
    description_az: str = ""

    # location of the thread (taken from the root report)
    lat: float = Field(index=True)
    lng: float = Field(index=True)

    # lifecycle
    status: IssueStatus = Field(default=IssueStatus.AI_REVIEW, index=True)
    rejection_reason_az: Optional[str] = None      # set if status == REJECTED
    deadline: Optional[datetime] = None            # from taxonomy.compute_deadline
    operator_notes: Optional[str] = None

    # routing
    org_key: Optional[str] = Field(default=None, foreign_key="organization.key")
    org: Optional["Organization"] = Relationship(back_populates="issues")

    # threading
    root_report_id: Optional[int] = None           # the "main" post
    report_count: int = Field(default=1)           # distinct citizen reports (reach)
    ai_confidence: float = Field(default=0.0)       # confidence of the root intake
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSON))

    # derived (recomputed on change; cached for fast map/list reads)
    priority: float = Field(default=0.0, index=True)

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    reports: List["Report"] = Relationship(back_populates="issue")


class Report(SQLModel, table=True):
    """One citizen submission: a photo + where it was taken + that photo's AI result."""
    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    issue_id: Optional[int] = Field(default=None, foreign_key="issue.id", index=True)

    image_url: str                                 # stored object / path
    user_text: str = ""                            # citizen's own typed description
    lat: float
    lng: float

    # snapshot of the AI intake for THIS photo (audit trail — never overwritten)
    ai_is_relevant: bool = True
    ai_category: Optional[Category] = None
    ai_severity: Optional[Severity] = None
    ai_confidence: float = 0.0
    ai_raw: dict = Field(default_factory=dict, sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=_utcnow)

    user: Optional["User"] = Relationship(back_populates="reports")
    issue: Optional["Issue"] = Relationship(back_populates="reports")


# --- demo bootstrap --------------------------------------------------------

SQLITE_URL = "sqlite:///openwave.db"
engine = create_engine(SQLITE_URL, echo=False)


def init_db() -> None:
    """Create tables and seed the organization rows from taxonomy.ORGS."""
    from sqlmodel import Session
    from taxonomy import ORGS

    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        for o in ORGS.values():
            if not s.get(Organization, o.key):
                s.add(Organization(key=o.key, name_az=o.name_az,
                                   scope=o.scope, contact_hint=o.contact_hint))
        s.commit()
    print("DB ready (openwave.db) with", len(ORGS), "organizations seeded.")
