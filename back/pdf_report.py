"""
pdf_report.py — Activity-account PDF using reportlab.

Produces an A4 document with:
  - Summary stats (total, open, resolved, overdue)
  - Breakdown by status
  - Breakdown by category (sorted by volume)
  - Table of the most recent 20 issues

Azerbaijani-specific characters (ə ı ğ ş) are silently transliterated to
ASCII because reportlab's built-in Helvetica is Latin-1.  All structural
text is in azerbaijani but written to survive the transliteration.

Usage:
    from pdf_report import build_pdf
    pdf_bytes = build_pdf(issues)          # list[Issue] from SQLModel
"""

from __future__ import annotations

import io
from datetime import datetime
from typing import Sequence


# ── Transliteration (Helvetica is Latin-1; ə ı ğ ş are outside it) ──────────

_AZ_TABLE = str.maketrans({
    'ə': 'e', 'Ə': 'E',
    'ı': 'i', 'İ': 'I',
    'ğ': 'g', 'Ğ': 'G',
    'ş': 's', 'Ş': 'S',
})


def _t(text: str) -> str:
    """Transliterate AZ-specific chars so Helvetica can render them."""
    return str(text).translate(_AZ_TABLE)


# ── Style helpers ─────────────────────────────────────────────────────────────

_RED   = "#870012"
_DARK  = "#281716"
_LIGHT = "#FFF5F5"
_GREY  = "#5C403E"

def _header_style():
    from reportlab.lib import colors
    return [
        ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor(_RED)),
        ("TEXTCOLOR",    (0, 0), (-1, 0), colors.white),
        ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME",     (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",     (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor(_LIGHT)]),
        ("GRID",         (0, 0), (-1, -1), 0.4, colors.HexColor("#E5BDBA")),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("LEFTPADDING",  (0, 0), (-1, -1), 7),
    ]


# ── Public entry point ────────────────────────────────────────────────────────

def build_pdf(issues: Sequence) -> bytes:
    """
    Build the PDF and return the raw bytes.
    `issues` is a list of Issue SQLModel rows.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, KeepTogether,
    )

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        rightMargin=2 * cm, leftMargin=2 * cm,
        topMargin=2.5 * cm, bottomMargin=2 * cm,
        title="Openwave Fəaliyyət Hesabatı",
        author="Openwave Platform",
    )

    styles = getSampleStyleSheet()
    S = {
        "title": ParagraphStyle(
            "ow_title", parent=styles["Title"],
            fontSize=20, spaceAfter=4, textColor=colors.HexColor(_RED),
            alignment=TA_CENTER,
        ),
        "sub": ParagraphStyle(
            "ow_sub", parent=styles["Normal"],
            fontSize=9, textColor=colors.HexColor(_GREY), alignment=TA_CENTER,
        ),
        "h2": ParagraphStyle(
            "ow_h2", parent=styles["Heading2"],
            fontSize=11, spaceBefore=14, spaceAfter=5,
            textColor=colors.HexColor(_DARK),
        ),
        "body": ParagraphStyle(
            "ow_body", parent=styles["Normal"],
            fontSize=9, textColor=colors.HexColor(_DARK),
        ),
        "footer": ParagraphStyle(
            "ow_footer", parent=styles["Normal"],
            fontSize=8, textColor=colors.grey, alignment=TA_CENTER, spaceBefore=8,
        ),
    }

    now = datetime.utcnow()
    story = []

    # ── Title ─────────────────────────────────────────────────────────────────
    story.append(Paragraph("Openwave", S["title"]))
    story.append(Paragraph(
        _t("Fəaliyyət Hesabatı — Nərimanov Rayonu"),
        ParagraphStyle("ow_sub2", parent=S["sub"], fontSize=11,
                       textColor=colors.HexColor(_DARK), spaceAfter=2),
    ))
    story.append(Paragraph(f"Tarix: {now.strftime('%Y-%m-%d  %H:%M')} UTC", S["sub"]))
    story.append(Spacer(1, 0.4 * cm))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor(_RED)))
    story.append(Spacer(1, 0.4 * cm))

    # ── Summary stats ─────────────────────────────────────────────────────────
    total    = len(issues)
    open_c   = sum(1 for i in issues if not i.status.is_terminal)
    res_c    = sum(1 for i in issues if i.status.value == "resolved")
    rej_c    = sum(1 for i in issues if i.status.value == "rejected")
    over_c   = sum(
        1 for i in issues
        if i.deadline and i.deadline < now and not i.status.is_terminal
    )

    resolved_with_deadline = [
        i for i in issues if i.status.value == "resolved" and i.deadline
    ]
    avg_days = 0.0
    if resolved_with_deadline:
        avg_days = (
            sum((i.deadline - i.created_at).days for i in resolved_with_deadline)
            / len(resolved_with_deadline)
        )

    story.append(Paragraph(_t("Ümumi Statistika"), S["h2"]))
    summary_rows = [
        [_t("Göstərici"), "Say"],
        [_t("Ümumi müraciət"),                    str(total)],
        [_t("Açıq (aktiv)"),                      str(open_c)],
        [_t("Həll edilmiş"),                       str(res_c)],
        [_t("Rədd edilmiş"),                       str(rej_c)],
        [_t("Gecikmiş (aktiv, vaxtı keçib)"),      str(over_c)],
        [_t("Ort. həll müddəti (gün)"),            f"{avg_days:.1f}"],
    ]
    t_summary = Table(summary_rows, colWidths=[12 * cm, 4 * cm])
    t_summary.setStyle(TableStyle(_header_style()))
    story.append(t_summary)
    story.append(Spacer(1, 0.3 * cm))

    # ── By status ─────────────────────────────────────────────────────────────
    by_status: dict[str, int] = {}
    for i in issues:
        by_status[i.status.value] = by_status.get(i.status.value, 0) + 1

    story.append(Paragraph("Status üzrə", S["h2"]))
    rows_status = [["Status", "Say"]] + [
        [k, str(v)] for k, v in sorted(by_status.items())
    ]
    t_status = Table(rows_status, colWidths=[12 * cm, 4 * cm])
    t_status.setStyle(TableStyle(_header_style()))
    story.append(t_status)
    story.append(Spacer(1, 0.3 * cm))

    # ── By category ───────────────────────────────────────────────────────────
    by_cat: dict[str, int] = {}
    for i in issues:
        by_cat[i.category.value] = by_cat.get(i.category.value, 0) + 1

    story.append(Paragraph(_t("Kateqoriya üzrə"), S["h2"]))
    rows_cat = [["Kateqoriya", "Say"]] + [
        [k, str(v)] for k, v in sorted(by_cat.items(), key=lambda x: -x[1])
    ]
    t_cat = Table(rows_cat, colWidths=[12 * cm, 4 * cm])
    t_cat.setStyle(TableStyle(_header_style()))
    story.append(t_cat)
    story.append(Spacer(1, 0.3 * cm))

    # ── Recent issues (last 20) ───────────────────────────────────────────────
    recent = sorted(issues, key=lambda i: i.created_at, reverse=True)[:20]
    if recent:
        story.append(Paragraph(_t("Son Müraciətlər (maks. 20)"), S["h2"]))
        rows_recent = [["ID", "Kateqoriya", "Ciddilik", "Status", _t("Son yeniləmə")]]
        for i in recent:
            rows_recent.append([
                str(i.id),
                i.category.value,
                i.severity.value,
                i.status.value,
                i.updated_at.strftime("%Y-%m-%d"),
            ])
        t_recent = Table(
            rows_recent,
            colWidths=[1.5 * cm, 4.5 * cm, 3 * cm, 3.5 * cm, 3.5 * cm],
        )
        style = _header_style()
        style.append(("FONTSIZE", (0, 0), (-1, -1), 8))
        t_recent.setStyle(TableStyle(style))
        story.append(KeepTogether(t_recent))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.5 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor(_RED)))
    story.append(Paragraph(
        _t("Openwave — Nərimanov Rayonu İcra Hakimiyyəti tərəfindən istifadə üçün."),
        S["footer"],
    ))

    doc.build(story)
    return buf.getvalue()
