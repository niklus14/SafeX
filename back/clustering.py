"""
clustering.py — CLUSTERING, PRIORITY, HEATMAP (one set of rules, two views).

The admin "dots vs threads" toggle and the citizen "X-style thread" are the SAME
data seen two ways. This module owns the rules that produce it:

  1. THREAD JOIN RULE — when a new report folds into an existing issue:
        within RADIUS_M metres  AND  same category  AND  thread not resolved.
     Otherwise it opens a NEW thread, and its report becomes the root ("main"
     post, like the first tweet). Everything else hangs under it as a reply.

  2. PRIORITY — severity + how many distinct citizens reported + how old it is.
     This is why a hotspot ≠ "many dots"; it's "many people affected, unresolved,
     for a while". Drives the admin sort order.

  3. HEATMAP INTENSITY — a 0–1 value per thread for the heatmap layer, derived
     from the same priority, so the red blobs and the sorted list always agree.

Pure functions, no DB — the API layer feeds these candidate threads from a
bounding-box query and persists the decision.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone

from enums import Category, IssueStatus, Severity

# A new report within this many metres of a same-category open thread joins it.
# 75 m ≈ "same street segment / same intersection" in dense Nərimanov blocks.
RADIUS_M = 75.0


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in metres between two lat/lng points."""
    r = 6_371_000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


@dataclass
class ThreadCandidate:
    """Minimal view of an existing thread, as the API would hand it to us."""
    id: str
    category: Category
    status: IssueStatus
    lat: float
    lng: float


def find_thread(new_lat: float, new_lng: float, new_category: Category,
                candidates: list[ThreadCandidate]) -> ThreadCandidate | None:
    """
    Decide which existing thread a new report joins, or None to open a new one.
    'candidates' should already be roughly local (e.g. a bounding-box DB query);
    we apply the exact rule here and pick the NEAREST qualifying thread.
    """
    best: ThreadCandidate | None = None
    best_d = RADIUS_M
    for c in candidates:
        if c.category != new_category:
            continue
        if c.status.is_terminal:          # resolved/rejected threads don't reopen
            continue
        d = haversine_m(new_lat, new_lng, c.lat, c.lng)
        if d <= best_d:
            best, best_d = c, d
    return best


# --- priority + heatmap ----------------------------------------------------

def priority_score(severity: Severity, report_count: int,
                   root_created: datetime, now: datetime | None = None) -> float:
    """
    Higher = more urgent. Three intuitive drivers:
      severity   : HIGH issues outrank LOW
      reach      : more distinct citizens reporting = bigger real-world impact
                   (log-damped so 50 reports doesn't dwarf everything)
      staleness  : older open issues climb (capped at 14 days of contribution)
    """
    now = now or datetime.now(timezone.utc).replace(tzinfo=None)
    sev = severity.weight * 10                       # 10 / 20 / 30
    reach = math.log2(max(report_count, 1) + 1) * 8  # 1->8, 3->16, 7->24 ...
    age_days = max(0.0, (now - root_created).total_seconds() / 86_400)
    staleness = min(age_days, 14) * 1.5              # up to ~21
    return round(sev + reach + staleness, 2)


# Reasonable ceiling for normalising priority -> 0..1 for the heatmap.
# (HIGH=30 + ~32 reach + 21 staleness ≈ 80; we clamp.)
_HEAT_MAX = 80.0


def heat_intensity(score: float) -> float:
    """Map a priority score to 0..1 for the heatmap layer."""
    return max(0.0, min(1.0, score / _HEAT_MAX))


def heat_color(intensity: float) -> str:
    """
    Bucketed colour for the heatmap dots/threads, matched to the deck's red theme.
    Cool (few/low) -> hot (many/high). Returned as hex for the map layer.
    """
    if intensity >= 0.75:
        return "#b3001b"   # critical red
    if intensity >= 0.50:
        return "#e23b2e"   # hot
    if intensity >= 0.25:
        return "#f0833a"   # warm
    return "#f2c14e"       # mild (amber)
