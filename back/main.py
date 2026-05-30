"""
main.py — FastAPI wiring every route onto the verified spine.

Run (mock AI — no API key needed):
    cd back && OPENWAVE_MOCK=1 uvicorn main:app --reload --port 8000

Run (real Grok intake):
    cd back && XAI_API_KEY=xai-... uvicorn main:app --reload --port 8000

Auth note: demo-simple — caller passes user_id directly; real SSO is out of scope.
Images:    uploads saved to ./uploads/ and served as static files at /uploads/<name>.
"""

from __future__ import annotations

import csv
import io
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select

import rewards
import pdf_report
from ai_intake import analyze_image
from clustering import ThreadCandidate, find_thread, heat_color, heat_intensity, priority_score
from enums import CITIZEN_PIPELINE, Category, IssueStatus, Severity
from models import Issue, Organization, Report, User, engine, init_db
from taxonomy import compute_deadline, suggest_org


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ---------------------------------------------------------------------------
# App lifecycle

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Openwave API", version="1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


def _db() -> Session:
    with Session(engine) as s:
        yield s


# ---------------------------------------------------------------------------
# Internal helpers

def _recompute_priority(issue: Issue) -> None:
    issue.priority = priority_score(issue.severity, issue.report_count, issue.created_at)
    issue.updated_at = _utcnow()


def _steps(status: IssueStatus) -> list[dict]:
    """Citizen-stepper representation of an issue status."""
    try:
        current_idx = CITIZEN_PIPELINE.index(status)
    except ValueError:
        current_idx = -1  # REJECTED — all steps pending

    result = []
    for idx, s in enumerate(CITIZEN_PIPELINE):
        if current_idx == -1:
            step_status, subtitle = "pending", ""
        elif idx < current_idx:
            step_status, subtitle = "completed", "Tamamlandı"
        elif idx == current_idx:
            step_status, subtitle = "current", "Hazırda bu mərhələdədir"
        else:
            step_status, subtitle = "pending", ""
        result.append({"name": s.label_az, "status": step_status, "subtitle": subtitle})
    return result


# ---------------------------------------------------------------------------
# Citizen: user registration

@app.post("/users", summary="Register a citizen (demo-simple, no real auth)")
def create_user(
    display_name: str = Form(...),
    phone: Optional[str] = Form(None),
    session: Session = Depends(_db),
):
    user = User(display_name=display_name, phone=phone)
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"id": user.id, "display_name": user.display_name,
            "credibility": user.credibility, "coins": user.coins}


# ---------------------------------------------------------------------------
# Citizen: submit a report (the golden path)

@app.post("/reports", summary="Submit a report — the full intake + clustering pipeline")
async def submit_report(
    image: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),   # demo fallback when no real camera
    description: str = Form(""),
    lat: float = Form(40.4093),
    lng: float = Form(49.8671),
    user_id: int = Form(...),
    session: Session = Depends(_db),
):
    # ── 1. Fetch + validate user ──────────────────────────────────────────────
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if rewards.is_throttled(user):
        raise HTTPException(403, "Credibility too low — repeated irrelevant submissions blocked")

    # ── 2. Resolve image ──────────────────────────────────────────────────────
    if image and image.filename:
        img_bytes = await image.read()
        mime = image.content_type or "image/jpeg"
        ext = image.filename.rsplit(".", 1)[-1] if "." in image.filename else "jpg"
        fname = f"{uuid.uuid4().hex}.{ext}"
        with open(os.path.join(UPLOADS_DIR, fname), "wb") as f:
            f.write(img_bytes)
        stored_url = f"/uploads/{fname}"
    elif image_url:
        # Demo / mobile prototype sends a preset URL — pass placeholder bytes to mock
        img_bytes = b"demo" * 200
        mime = "image/jpeg"
        stored_url = image_url
    else:
        raise HTTPException(400, "Provide either 'image' (file upload) or 'image_url'")

    # ── 3. AI intake ──────────────────────────────────────────────────────────
    intake = analyze_image(img_bytes, mime, user_text=description)

    if not intake.is_relevant:
        rewards.ding_credibility(user)
        session.add(user)
        session.commit()
        return {
            "is_relevant": False,
            "rejection_reason_az": intake.rejection_reason_az,
            "credibility": user.credibility,
        }

    # ── 4. Deadline + default org ─────────────────────────────────────────────
    deadline = compute_deadline(intake.category, intake.severity)
    org = suggest_org(intake.category)

    # ── 5. Clustering: join existing thread or open a new one ─────────────────
    #    Bounding-box pre-filter (≈ 220 m) then haversine inside find_thread (75 m)
    all_issues = session.exec(select(Issue)).all()
    nearby_candidates = [
        ThreadCandidate(str(i.id), i.category, i.status, i.lat, i.lng)
        for i in all_issues
        if abs(i.lat - lat) <= 0.002 and abs(i.lng - lng) <= 0.002
    ]
    matched = find_thread(lat, lng, intake.category, nearby_candidates)

    report_kwargs = dict(
        user_id=user_id, image_url=stored_url, user_text=description,
        lat=lat, lng=lng, ai_is_relevant=True,
        ai_category=intake.category, ai_severity=intake.severity,
        ai_confidence=intake.confidence, ai_raw=intake.raw,
    )

    if matched:
        # Join existing thread
        issue = session.get(Issue, int(matched.id))
        issue.report_count += 1
        _recompute_priority(issue)
        session.add(issue)
        session.flush()
        session.add(Report(issue_id=issue.id, **report_kwargs))
        rewards.award_clustered(user)
        session.add(user)
        session.commit()
        session.refresh(issue)
        joined = True
    else:
        # Open a new issue thread
        issue = Issue(
            category=intake.category, severity=intake.severity,
            title_az=intake.title_az, description_az=intake.description_az,
            lat=lat, lng=lng, status=IssueStatus.MANUAL_REVIEW,
            deadline=deadline, org_key=org.key,
            ai_confidence=intake.confidence, tags=intake.tags,
        )
        session.add(issue)
        session.flush()
        report = Report(issue_id=issue.id, **report_kwargs)
        session.add(report)
        session.flush()
        issue.root_report_id = report.id
        _recompute_priority(issue)
        session.add(issue)
        rewards.award_new_report(user)
        session.add(user)
        session.commit()
        session.refresh(issue)
        joined = False

    return {
        "is_relevant": True,
        "issue_id": issue.id,
        "joined_thread": joined,
        "status": issue.status.value,
        "category": issue.category.value,
        "severity": issue.severity.value,
        "title_az": issue.title_az,
        "deadline": issue.deadline.isoformat() if issue.deadline else None,
    }


# ---------------------------------------------------------------------------
# Citizen: read routes

@app.get("/issues/{issue_id}", summary="Issue detail + X-style thread + citizen stepper")
def get_issue(issue_id: int, session: Session = Depends(_db)):
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404, "Issue not found")

    thread = session.exec(select(Report).where(Report.issue_id == issue_id)).all()
    thread.sort(key=lambda r: r.created_at)
    org = session.get(Organization, issue.org_key) if issue.org_key else None

    return {
        "id": issue.id,
        "category": issue.category.value,
        "severity": issue.severity.value,
        "title_az": issue.title_az,
        "description_az": issue.description_az,
        "status": issue.status.value,
        "deadline": issue.deadline.isoformat() if issue.deadline else None,
        "created_at": issue.created_at.isoformat(),
        "lat": issue.lat, "lng": issue.lng,
        "org": {"key": org.key, "name_az": org.name_az} if org else None,
        "report_count": issue.report_count,
        "reports": [
            {
                "id": r.id, "user_text": r.user_text, "image_url": r.image_url,
                "created_at": r.created_at.isoformat(),
                "is_root": r.id == issue.root_report_id,
            }
            for r in thread
        ],
        "steps": _steps(issue.status),
    }


@app.get("/me/{user_id}", summary="Citizen profile: coins, credibility, contributed issues")
def get_me(user_id: int, session: Session = Depends(_db)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    user_reports = session.exec(select(Report).where(Report.user_id == user_id)).all()
    user_reports.sort(key=lambda r: r.created_at, reverse=True)

    report_list = []
    for r in user_reports:
        issue = session.get(Issue, r.issue_id) if r.issue_id else None
        if issue:
            report_list.append({
                "issue_id": issue.id, "status": issue.status.value,
                "title_az": issue.title_az, "category": issue.category.value,
                "image_url": r.image_url, "created_at": r.created_at.isoformat(),
                "deadline": issue.deadline.isoformat() if issue.deadline else None,
            })

    return {
        "id": user.id, "display_name": user.display_name,
        "credibility": user.credibility, "coins": user.coins,
        "reports": report_list,
    }


@app.get("/rewards", summary="Static rewards catalogue (marketplace mocked per spec)")
def get_rewards():
    return [
        {"id": "r1", "title_az": "Kofe 20% endirim",
         "badge": "20% Endirim", "cost_coins": 50, "partner": "Demo Coffee",
         "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBBi76xPqNqPbKTxEKTNbZ7jBKL3hjVN85lCCzi_JCjMeRRdKsC-ScC9WWhB5AuVi5DuYbV8SibcSZY2WRIhTWqTE9CIQtsoGe7bQu5ikp_DfR4bkNnTV3Y84s-BgdTOHcoIVSBXhpXW0ceaUJbT6S9NtjMtrEKcMgyqTqCP3Kszo8V4VshmS68kkWIGT0wS9Z7rvdLXJoD5HPN7tvwbeI1w_i_ev-PNV6JCxar7J9b_H7M-l8djjhlkbfxIHP9i1j_p3sacP-2p8I"},
        {"id": "r2", "title_az": "Market alis-verisi (5 AZN Kupon)",
         "badge": "5 AZN Kupon", "cost_coins": 120, "partner": "Bravo Demo",
         "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuDYKrlDTk-nmyTAntHX-axOYPx6p5PLBtceTrjTzDN3nzOEtyasi4Xj-RPMaT2JTW7kbBf3mD5bcTvF56J9yOIKIb6OEXBQ6IwqwjPAl5HDMgaIBTGBy5_aEP7f8lel_sCChpADeQA8cJ7TvYFVEyf1y_wLgXxlhTorxDQJNGLxTd3gUDbD7vjOuKuKfGWdCaAMx_yyEvLLajcGUL8AQNatPnVzDY6pXhhMMos3TmXWm3yHb-yy8tPYvFviNJKMGVaOV9Aelu2-CzY"},
        {"id": "r3", "title_az": "Sinema bileti (1+1)",
         "badge": "1+1 Bilet", "cost_coins": 200, "partner": "CinemaPlus Demo",
         "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBdGwlG-OUWElFP1MMqHq2jQyvXZOgER13dxH1EaPJOGQa5ktg0pDVOoQ2r9q-ezfwxZZCYbAAbmqpXXaCqScOOnn_e_7FjugaprFS2H-k1cvdVG265DveVCUah_D_fuvumXejFW_DX8ld0cBMKqOqIttfwtFyLJitWoWktRzkDw4w6j8YTfpVJ_hIUcTiCQxwNB0N2pC8gW61VnVsPL_NbDEQr0VfokHemcucbTeyFuXUqXdx14N9ytBCIiNpXdfpqKN_aHySyfQU"},
        {"id": "r4", "title_az": "Nəqliyyat karti (Pulsuz gedis)",
         "badge": "Pulsuz Gedis", "cost_coins": 80, "partner": "BakiKart Demo",
         "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuCGNRYdHc0kongw44drdjyWsGerljfVzCMkYsz-b8aZ2oOLvH16Icwo7JfPPqiLmVGZLuSo2FlO1pQxHSeDBHr0DzVuZsYivadCK0QwJpMV4HA-xrkxMJd9VuKNAaBITCvLaprQUndkB7O6eU4-w9PYFwXDOlXI9d8TRZdnWirnB1rRz1-AJrqXvjhcaooTf2PJyuIk87U266aM5fh46f690yNulITz4A-2mqoVK8UvFf0bFy4vAP6HMmNyRyQRYbnE0us7sCEsYE8"},
    ]


# ---------------------------------------------------------------------------
# Admin: queue + map

@app.get("/admin/issues", summary="Paginated queue — filter by status/category/org, sort by priority/deadline/created")
def admin_list_issues(
    status: Optional[str] = None,
    category: Optional[str] = None,
    org_key: Optional[str] = None,
    sort: str = "priority",
    page: int = 1,
    page_size: int = 20,
    session: Session = Depends(_db),
):
    issues = session.exec(select(Issue)).all()

    if status:
        try:
            s_enum = IssueStatus(status)
        except ValueError:
            raise HTTPException(422, f"Unknown status '{status}'")
        issues = [i for i in issues if i.status == s_enum]

    if category:
        try:
            c_enum = Category(category)
        except ValueError:
            raise HTTPException(422, f"Unknown category '{category}'")
        issues = [i for i in issues if i.category == c_enum]

    if org_key:
        issues = [i for i in issues if i.org_key == org_key]

    if sort == "priority":
        issues.sort(key=lambda i: i.priority, reverse=True)
    elif sort == "deadline":
        issues.sort(key=lambda i: i.deadline or datetime.max)
    else:
        issues.sort(key=lambda i: i.created_at, reverse=True)

    total = len(issues)
    page_items = issues[(page - 1) * page_size : page * page_size]

    return {
        "total": total,
        "items": [
            {
                "id": i.id, "title_az": i.title_az,
                "category": i.category.value, "severity": i.severity.value,
                "status": i.status.value, "priority": i.priority,
                "report_count": i.report_count, "org_key": i.org_key,
                "deadline": i.deadline.isoformat() if i.deadline else None,
                "ai_confidence": i.ai_confidence,
                "lat": i.lat, "lng": i.lng,
            }
            for i in page_items
        ],
    }


@app.get("/admin/map", summary="Heatmap / dots layer — active issues only with intensity + colour")
def admin_map(session: Session = Depends(_db)):
    issues = session.exec(select(Issue)).all()
    return [
        {
            "id": i.id, "lat": i.lat, "lng": i.lng,
            "category": i.category.value, "report_count": i.report_count,
            "priority": i.priority,
            "intensity": round(heat_intensity(i.priority), 3),
            "color": heat_color(heat_intensity(i.priority)),
        }
        for i in issues if not i.status.is_terminal
    ]


# ---------------------------------------------------------------------------
# Admin: actions

@app.post("/admin/issues/{issue_id}/approve",
          summary="Confirm / override AI classification, route to org → status becomes routed")
def admin_approve(
    issue_id: int,
    severity: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    org_key: Optional[str] = Form(None),
    deadline: Optional[str] = Form(None),
    operator_notes: Optional[str] = Form(None),
    session: Session = Depends(_db),
):
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404, "Issue not found")

    if severity:
        issue.severity = Severity(severity)
    if category:
        issue.category = Category(category)
    if org_key:
        issue.org_key = org_key
    if operator_notes:
        issue.operator_notes = operator_notes

    # Explicit deadline wins; otherwise recompute from (possibly updated) SLA table
    if deadline:
        issue.deadline = datetime.fromisoformat(deadline)
    else:
        issue.deadline = compute_deadline(issue.category, issue.severity, issue.created_at)

    issue.status = IssueStatus.ROUTED
    _recompute_priority(issue)
    session.add(issue)
    session.commit()

    return {
        "id": issue.id, "status": issue.status.value,
        "org_key": issue.org_key,
        "deadline": issue.deadline.isoformat() if issue.deadline else None,
    }


@app.post("/admin/issues/{issue_id}/reject",
          summary="Reject with a human-readable reason in Azerbaijani")
def admin_reject(
    issue_id: int,
    rejection_reason_az: str = Form(...),
    session: Session = Depends(_db),
):
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404, "Issue not found")
    issue.status = IssueStatus.REJECTED
    issue.rejection_reason_az = rejection_reason_az
    issue.updated_at = _utcnow()
    session.add(issue)
    session.commit()
    return {"id": issue.id, "status": issue.status.value}


@app.post("/admin/issues/{issue_id}/status",
          summary="Advance lifecycle: routed → in_progress → resolved (coins awarded on resolved)")
def admin_set_status(
    issue_id: int,
    status: str = Form(...),
    session: Session = Depends(_db),
):
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404, "Issue not found")
    try:
        new_status = IssueStatus(status)
    except ValueError:
        raise HTTPException(422, f"Unknown status '{status}'")

    issue.status = new_status
    issue.updated_at = _utcnow()
    session.add(issue)

    if new_status == IssueStatus.RESOLVED:
        # Award every citizen who submitted a report on this issue
        contributing_reports = session.exec(
            select(Report).where(Report.issue_id == issue_id)
        ).all()
        contributors = [
            u for uid in {r.user_id for r in contributing_reports if r.user_id}
            if (u := session.get(User, uid))
        ]
        rewards.award_resolved(contributors)
        for u in contributors:
            session.add(u)

    session.commit()
    return {"id": issue.id, "status": issue.status.value}


# ---------------------------------------------------------------------------
# Admin: reference data + stats

@app.get("/admin/orgs", summary="List responsible bodies (for the assign dropdown)")
def admin_orgs(session: Session = Depends(_db)):
    return [
        {"key": o.key, "name_az": o.name_az, "scope": o.scope}
        for o in session.exec(select(Organization)).all()
    ]


@app.get("/admin/stats", summary="Dashboard KPI cards")
def admin_stats(session: Session = Depends(_db)):
    issues = session.exec(select(Issue)).all()
    now = _utcnow()

    open_c    = sum(1 for i in issues if not i.status.is_terminal)
    resolved  = sum(1 for i in issues if i.status == IssueStatus.RESOLVED)
    overdue   = sum(1 for i in issues if i.deadline and i.deadline < now and not i.status.is_terminal)

    res_with_deadline = [i for i in issues if i.status == IssueStatus.RESOLVED and i.deadline]
    avg_days = (
        sum((i.deadline - i.created_at).days for i in res_with_deadline)
        / len(res_with_deadline)
        if res_with_deadline else 0.0
    )

    by_cat: dict[str, int] = {}
    by_status: dict[str, int] = {}
    for i in issues:
        by_cat[i.category.value]    = by_cat.get(i.category.value, 0) + 1
        by_status[i.status.value] = by_status.get(i.status.value, 0) + 1

    return {
        "open": open_c, "resolved": resolved, "overdue": overdue,
        "avg_resolution_days": round(avg_days, 1),
        "by_category": by_cat, "by_status": by_status,
    }


# ---------------------------------------------------------------------------
# Admin: import / export

@app.post("/admin/import",
          summary="Bulk-import historical issues from CSV (columns: see data/sample_import.csv)")
async def admin_import(
    file: UploadFile = File(...),
    session: Session = Depends(_db),
):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    imported = skipped = 0

    for row in reader:
        try:
            cat     = Category(row["category"])
            sev     = Severity(row["severity"])
            st      = IssueStatus(row.get("status", "resolved"))
            created = (datetime.fromisoformat(row["created_at"])
                       if row.get("created_at") else _utcnow())
            issue = Issue(
                category=cat, severity=sev,
                title_az=row.get("title_az", ""),
                description_az=row.get("description_az", ""),
                lat=float(row.get("lat", 40.4093)),
                lng=float(row.get("lng", 49.8671)),
                status=st,
                org_key=row.get("org_key") or None,
                created_at=created,
            )
            issue.deadline = compute_deadline(cat, sev, created)
            _recompute_priority(issue)
            session.add(issue)
            imported += 1
        except Exception:
            skipped += 1

    session.commit()
    return {"imported": imported, "skipped": skipped}


@app.get("/admin/export.pdf",
         summary="Activity-account PDF (reportlab) — the feasibility/accountability story for the jury")
def admin_export_pdf(session: Session = Depends(_db)):
    issues = session.exec(select(Issue)).all()
    try:
        pdf_bytes = pdf_report.build_pdf(issues)
    except Exception as exc:
        raise HTTPException(500, f"PDF generation failed: {exc}")

    fname = f"openwave-{_utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )
