"""
main.py — FastAPI wiring all routes onto the verified spine.

Run (with mock AI, no key needed):
    cd back && OPENWAVE_MOCK=1 uvicorn main:app --reload --port 8000

For real AI intake:
    cd back && XAI_API_KEY=xai-... uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import csv
import io
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select

from ai_intake import analyze_image
from clustering import (
    ThreadCandidate,
    find_thread,
    heat_color,
    heat_intensity,
    priority_score,
)
from enums import CITIZEN_PIPELINE, Category, IssueStatus, Severity
from models import Issue, Organization, Report, User, engine, init_db
from taxonomy import compute_deadline, suggest_org

# ---------------------------------------------------------------------------
# App setup

app = FastAPI(title="Openwave API", version="1.0")

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


@app.on_event("startup")
def on_startup() -> None:
    init_db()


def get_session():
    with Session(engine) as s:
        yield s


# ---------------------------------------------------------------------------
# Internal helpers

def _recompute_priority(issue: Issue) -> None:
    issue.priority = priority_score(issue.severity, issue.report_count, issue.created_at)
    issue.updated_at = datetime.utcnow()


def _build_steps(status: IssueStatus) -> list[dict]:
    """Map IssueStatus to the citizen stepper steps array."""
    steps = []
    try:
        current_idx = CITIZEN_PIPELINE.index(status)
    except ValueError:
        current_idx = -1  # REJECTED — render all as pending

    for idx, s in enumerate(CITIZEN_PIPELINE):
        if current_idx == -1:
            step_status = "pending"
            subtitle = ""
        elif idx < current_idx:
            step_status = "completed"
            subtitle = "Tamamlandı"
        elif idx == current_idx:
            step_status = "current"
            subtitle = "Hazırda bu mərhələdədir"
        else:
            step_status = "pending"
            subtitle = ""
        steps.append({"name": s.label_az, "status": step_status, "subtitle": subtitle})
    return steps


# ---------------------------------------------------------------------------
# Citizen routes

@app.post("/users")
def create_user(
    display_name: str = Form(...),
    phone: Optional[str] = Form(None),
    session: Session = Depends(get_session),
):
    user = User(display_name=display_name, phone=phone)
    session.add(user)
    session.commit()
    session.refresh(user)
    return {
        "id": user.id,
        "display_name": user.display_name,
        "credibility": user.credibility,
        "coins": user.coins,
    }


@app.post("/reports")
async def submit_report(
    image: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    description: str = Form(""),
    lat: float = Form(40.4093),
    lng: float = Form(49.8671),
    user_id: int = Form(...),
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    if user.credibility < 30:
        raise HTTPException(403, "Credibility too low to submit reports")

    # Resolve image
    if image and image.filename:
        img_bytes = await image.read()
        mime = image.content_type or "image/jpeg"
        ext = (image.filename.rsplit(".", 1)[-1] if "." in image.filename else "jpg")
        fname = f"{uuid.uuid4().hex}.{ext}"
        with open(os.path.join(UPLOADS_DIR, fname), "wb") as f:
            f.write(img_bytes)
        stored_url = f"/uploads/{fname}"
    elif image_url:
        img_bytes = b"demo" * 200   # placeholder for mock mode
        mime = "image/jpeg"
        stored_url = image_url
    else:
        raise HTTPException(400, "Provide either 'image' (file) or 'image_url'")

    # AI intake
    intake = analyze_image(img_bytes, mime, user_text=description)

    if not intake.is_relevant:
        user.credibility = max(0, user.credibility - 10)
        session.add(user)
        session.commit()
        return {
            "is_relevant": False,
            "rejection_reason_az": intake.rejection_reason_az,
            "credibility": user.credibility,
        }

    # Compute deadline + default org
    deadline = compute_deadline(intake.category, intake.severity)
    org = suggest_org(intake.category)

    # Clustering: find nearest open same-category thread within 75 m
    all_issues = session.exec(select(Issue)).all()
    nearby = [
        i for i in all_issues
        if abs(i.lat - lat) <= 0.002 and abs(i.lng - lng) <= 0.002
    ]
    candidates = [
        ThreadCandidate(str(i.id), i.category, i.status, i.lat, i.lng)
        for i in nearby
    ]
    matched = find_thread(lat, lng, intake.category, candidates)

    if matched:
        # Join existing issue thread
        issue = session.get(Issue, int(matched.id))
        issue.report_count += 1
        _recompute_priority(issue)
        session.add(issue)
        session.flush()

        report = Report(
            user_id=user_id, issue_id=issue.id,
            image_url=stored_url, user_text=description,
            lat=lat, lng=lng,
            ai_is_relevant=True,
            ai_category=intake.category,
            ai_severity=intake.severity,
            ai_confidence=intake.confidence,
            ai_raw=intake.raw,
        )
        session.add(report)

        user.coins += 5   # cluster bonus
        session.add(user)
        session.commit()
        session.refresh(issue)
        joined = True
    else:
        # Open a new issue thread
        issue = Issue(
            category=intake.category,
            severity=intake.severity,
            title_az=intake.title_az,
            description_az=intake.description_az,
            lat=lat, lng=lng,
            status=IssueStatus.MANUAL_REVIEW,
            deadline=deadline,
            org_key=org.key,
            ai_confidence=intake.confidence,
            tags=intake.tags,
        )
        session.add(issue)
        session.flush()   # get issue.id

        report = Report(
            user_id=user_id, issue_id=issue.id,
            image_url=stored_url, user_text=description,
            lat=lat, lng=lng,
            ai_is_relevant=True,
            ai_category=intake.category,
            ai_severity=intake.severity,
            ai_confidence=intake.confidence,
            ai_raw=intake.raw,
        )
        session.add(report)
        session.flush()   # get report.id

        issue.root_report_id = report.id
        _recompute_priority(issue)
        session.add(issue)

        user.coins += 10  # new accepted report bonus
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


@app.get("/issues/{issue_id}")
def get_issue(issue_id: int, session: Session = Depends(get_session)):
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404, "Issue not found")

    reports = session.exec(
        select(Report).where(Report.issue_id == issue_id)
    ).all()
    reports.sort(key=lambda r: r.created_at)

    org = session.get(Organization, issue.org_key) if issue.org_key else None

    report_list = [
        {
            "id": r.id,
            "user_text": r.user_text,
            "image_url": r.image_url,
            "created_at": r.created_at.isoformat(),
            "is_root": r.id == issue.root_report_id,
        }
        for r in reports
    ]

    return {
        "id": issue.id,
        "category": issue.category.value,
        "severity": issue.severity.value,
        "title_az": issue.title_az,
        "description_az": issue.description_az,
        "status": issue.status.value,
        "deadline": issue.deadline.isoformat() if issue.deadline else None,
        "created_at": issue.created_at.isoformat(),
        "lat": issue.lat,
        "lng": issue.lng,
        "org": {"key": org.key, "name_az": org.name_az} if org else None,
        "report_count": issue.report_count,
        "reports": report_list,
        "steps": _build_steps(issue.status),
    }


@app.get("/me/{user_id}")
def get_me(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    reports = session.exec(
        select(Report).where(Report.user_id == user_id)
    ).all()
    reports.sort(key=lambda r: r.created_at, reverse=True)

    report_list = []
    for r in reports:
        issue = session.get(Issue, r.issue_id) if r.issue_id else None
        if issue:
            report_list.append({
                "issue_id": issue.id,
                "status": issue.status.value,
                "title_az": issue.title_az,
                "category": issue.category.value,
                "image_url": r.image_url,
                "created_at": r.created_at.isoformat(),
                "deadline": issue.deadline.isoformat() if issue.deadline else None,
            })

    return {
        "id": user.id,
        "display_name": user.display_name,
        "credibility": user.credibility,
        "coins": user.coins,
        "reports": report_list,
    }


@app.get("/rewards")
def get_rewards():
    return [
        {
            "id": "r1",
            "title_az": "Kofe 20% endirim",
            "badge": "20% Endirim",
            "cost_coins": 50,
            "partner": "Demo Coffee",
            "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBBi76xPqNqPbKTxEKTNbZ7jBKL3hjVN85lCCzi_JCjMeRRdKsC-ScC9WWhB5AuVi5DuYbV8SibcSZY2WRIhTWqTE9CIQtsoGe7bQu5ikp_DfR4bkNnTV3Y84s-BgdTOHcoIVSBXhpXW0ceaUJbT6S9NtjMtrEKcMgyqTqCP3Kszo8V4VshmS68kkWIGT0wS9Z7rvdLXJoD5HPN7tvwbeI1w_i_ev-PNV6JCxar7J9b_H7M-l8djjhlkbfxIHP9i1j_p3sacP-2p8I",
        },
        {
            "id": "r2",
            "title_az": "Market alış-verişi (5 AZN Kupon)",
            "badge": "5 AZN Kupon",
            "cost_coins": 120,
            "partner": "Bravo Demo",
            "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuDYKrlDTk-nmyTAntHX-axOYPx6p5PLBtceTrjTzDN3nzOEtyasi4Xj-RPMaT2JTW7kbBf3mD5bcTvF56J9yOIKIb6OEXBQ6IwqwjPAl5HDMgaIBTGBy5_aEP7f8lel_sCChpADeQA8cJ7TvYFVEyf1y_wLgXxlhTorxDQJNGLxTd3gUDbD7vjOuKuKfGWdCaAMx_yyEvLLajcGUL8AQNatPnVzDY6pXhhMMos3TmXWm3yHb-yy8tPYvFviNJKMGVaOV9Aelu2-CzY",
        },
        {
            "id": "r3",
            "title_az": "Sinema bileti (1+1 Bilet)",
            "badge": "1+1 Bilet",
            "cost_coins": 200,
            "partner": "CinemaPlus Demo",
            "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBdGwlG-OUWElFP1MMqHq2jQyvXZOgER13dxH1EaPJOGQa5ktg0pDVOoQ2r9q-ezfwxZZCYbAAbmqpXXaCqScOOnn_e_7FjugaprFS2H-k1cvdVG265DveVCUah_D_fuvumXejFW_DX8ld0cBMKqOqIttfwtFyLJitWoWktRzkDw4w6j8YTfpVJ_hIUcTiCQxwNB0N2pC8gW61VnVsPL_NbDEQr0VfokHemcucbTeyFuXUqXdx14N9ytBCIiNpXdfpqKN_aHySyfQU",
        },
        {
            "id": "r4",
            "title_az": "Nəqliyyat kartı (Pulsuz gediş)",
            "badge": "Pulsuz Gediş",
            "cost_coins": 80,
            "partner": "BakıKart Demo",
            "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuCGNRYdHc0kongw44drdjyWsGerljfVzCMkYsz-b8aZ2oOLvH16Icwo7JfPPqiLmVGZLuSo2FlO1pQxHSeDBHr0DzVuZsYivadCK0QwJpMV4HA-xrkxMJd9VuKNAaBITCvLaprQUndkB7O6eU4-w9PYFwXDOlXI9d8TRZdnWirnB1rRz1-AJrqXvjhcaooTf2PJyuIk87U266aM5fh46f690yNulITz4A-2mqoVK8UvFf0bFy4vAP6HMmNyRyQRYbnE0us7sCEsYE8",
        },
    ]


# ---------------------------------------------------------------------------
# Admin routes

@app.get("/admin/issues")
def admin_list_issues(
    status: Optional[str] = None,
    category: Optional[str] = None,
    org_key: Optional[str] = None,
    sort: str = "priority",
    page: int = 1,
    page_size: int = 20,
    session: Session = Depends(get_session),
):
    issues = session.exec(select(Issue)).all()

    if status:
        try:
            s = IssueStatus(status)
            issues = [i for i in issues if i.status == s]
        except ValueError:
            raise HTTPException(422, f"Invalid status: {status}")
    if category:
        try:
            c = Category(category)
            issues = [i for i in issues if i.category == c]
        except ValueError:
            raise HTTPException(422, f"Invalid category: {category}")
    if org_key:
        issues = [i for i in issues if i.org_key == org_key]

    if sort == "priority":
        issues.sort(key=lambda i: i.priority, reverse=True)
    elif sort == "deadline":
        issues.sort(key=lambda i: i.deadline or datetime.max)
    else:
        issues.sort(key=lambda i: i.created_at, reverse=True)

    total = len(issues)
    offset = (page - 1) * page_size
    page_items = issues[offset : offset + page_size]

    return {
        "total": total,
        "items": [
            {
                "id": i.id,
                "title_az": i.title_az,
                "category": i.category.value,
                "severity": i.severity.value,
                "status": i.status.value,
                "priority": i.priority,
                "report_count": i.report_count,
                "org_key": i.org_key,
                "deadline": i.deadline.isoformat() if i.deadline else None,
                "ai_confidence": i.ai_confidence,
                "lat": i.lat,
                "lng": i.lng,
            }
            for i in page_items
        ],
    }


@app.get("/admin/map")
def admin_map(session: Session = Depends(get_session)):
    issues = session.exec(select(Issue)).all()
    active = [i for i in issues if not i.status.is_terminal]

    return [
        {
            "id": i.id,
            "lat": i.lat,
            "lng": i.lng,
            "category": i.category.value,
            "report_count": i.report_count,
            "priority": i.priority,
            "intensity": round(heat_intensity(i.priority), 3),
            "color": heat_color(heat_intensity(i.priority)),
        }
        for i in active
    ]


@app.post("/admin/issues/{issue_id}/approve")
def admin_approve(
    issue_id: int,
    severity: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    org_key: Optional[str] = Form(None),
    deadline: Optional[str] = Form(None),
    operator_notes: Optional[str] = Form(None),
    session: Session = Depends(get_session),
):
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404, "Issue not found")

    explicit_deadline = False
    if severity:
        issue.severity = Severity(severity)
    if category:
        issue.category = Category(category)
    if org_key:
        issue.org_key = org_key
    if deadline:
        issue.deadline = datetime.fromisoformat(deadline)
        explicit_deadline = True
    if operator_notes:
        issue.operator_notes = operator_notes

    if not explicit_deadline:
        issue.deadline = compute_deadline(issue.category, issue.severity, issue.created_at)

    issue.status = IssueStatus.ROUTED
    _recompute_priority(issue)
    session.add(issue)
    session.commit()

    return {
        "id": issue.id,
        "status": issue.status.value,
        "org_key": issue.org_key,
        "deadline": issue.deadline.isoformat() if issue.deadline else None,
    }


@app.post("/admin/issues/{issue_id}/reject")
def admin_reject(
    issue_id: int,
    rejection_reason_az: str = Form(...),
    session: Session = Depends(get_session),
):
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404, "Issue not found")
    issue.status = IssueStatus.REJECTED
    issue.rejection_reason_az = rejection_reason_az
    issue.updated_at = datetime.utcnow()
    session.add(issue)
    session.commit()
    return {"id": issue.id, "status": issue.status.value}


@app.post("/admin/issues/{issue_id}/status")
def admin_status(
    issue_id: int,
    status: str = Form(...),
    session: Session = Depends(get_session),
):
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404, "Issue not found")
    try:
        new_status = IssueStatus(status)
    except ValueError:
        raise HTTPException(422, f"Invalid status: {status}")

    issue.status = new_status
    issue.updated_at = datetime.utcnow()
    session.add(issue)

    if new_status == IssueStatus.RESOLVED:
        reports = session.exec(
            select(Report).where(Report.issue_id == issue_id)
        ).all()
        for uid in {r.user_id for r in reports if r.user_id}:
            u = session.get(User, uid)
            if u:
                u.coins += 20
                session.add(u)

    session.commit()
    return {"id": issue.id, "status": issue.status.value}


@app.get("/admin/orgs")
def admin_orgs(session: Session = Depends(get_session)):
    orgs = session.exec(select(Organization)).all()
    return [{"key": o.key, "name_az": o.name_az, "scope": o.scope} for o in orgs]


@app.get("/admin/stats")
def admin_stats(session: Session = Depends(get_session)):
    issues = session.exec(select(Issue)).all()
    now = datetime.utcnow()

    open_count = sum(1 for i in issues if not i.status.is_terminal)
    resolved = sum(1 for i in issues if i.status == IssueStatus.RESOLVED)
    overdue = sum(
        1 for i in issues
        if i.deadline and i.deadline < now and not i.status.is_terminal
    )

    resolved_issues = [
        i for i in issues if i.status == IssueStatus.RESOLVED and i.deadline
    ]
    avg_days = 0.0
    if resolved_issues:
        avg_days = (
            sum((i.deadline - i.created_at).days for i in resolved_issues)
            / len(resolved_issues)
        )

    by_cat: dict[str, int] = {}
    by_status: dict[str, int] = {}
    for i in issues:
        by_cat[i.category.value] = by_cat.get(i.category.value, 0) + 1
        by_status[i.status.value] = by_status.get(i.status.value, 0) + 1

    return {
        "open": open_count,
        "resolved": resolved,
        "overdue": overdue,
        "avg_resolution_days": round(avg_days, 1),
        "by_category": by_cat,
        "by_status": by_status,
    }


@app.post("/admin/import")
async def admin_import(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    imported = skipped = 0
    for row in reader:
        try:
            cat = Category(row["category"])
            sev = Severity(row["severity"])
            st = IssueStatus(row.get("status", "resolved"))
            created = (
                datetime.fromisoformat(row["created_at"])
                if row.get("created_at")
                else datetime.utcnow()
            )
            issue = Issue(
                category=cat,
                severity=sev,
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


@app.get("/admin/export.pdf")
def admin_export_pdf(session: Session = Depends(get_session)):
    try:
        from fpdf import FPDF  # type: ignore
    except ImportError:
        raise HTTPException(500, "fpdf2 not installed — run: pip install fpdf2")

    issues = session.exec(select(Issue)).all()
    now = datetime.utcnow()

    pdf = FPDF()
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Openwave - Fealiyyet Hesabati", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, f"Tarix: {now.strftime('%Y-%m-%d %H:%M')} UTC", ln=True, align="C")
    pdf.ln(4)

    open_c = sum(1 for i in issues if not i.status.is_terminal)
    resolved_c = sum(1 for i in issues if i.status == IssueStatus.RESOLVED)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Umumi Statistika", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 7, f"Umumi muraciet sayi: {len(issues)}", ln=True)
    pdf.cell(0, 7, f"Aciq: {open_c}   |   Hell edilmis: {resolved_c}", ln=True)
    pdf.ln(3)

    by_status: dict[str, int] = {}
    by_cat: dict[str, int] = {}
    for i in issues:
        by_status[i.status.value] = by_status.get(i.status.value, 0) + 1
        by_cat[i.category.value] = by_cat.get(i.category.value, 0) + 1

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "Status uzre", ln=True)
    pdf.set_font("Helvetica", "", 10)
    for s, cnt in sorted(by_status.items()):
        pdf.cell(0, 7, f"  {s}: {cnt}", ln=True)
    pdf.ln(3)

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "Kateqoriya uzre", ln=True)
    pdf.set_font("Helvetica", "", 10)
    for cat, cnt in sorted(by_cat.items(), key=lambda x: -x[1]):
        pdf.cell(0, 7, f"  {cat}: {cnt}", ln=True)

    out = io.BytesIO(bytes(pdf.output()))
    fname = f"openwave-export-{now.strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        out,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )
