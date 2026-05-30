"""
rewards.py — Coin + credibility rules (the ONLY place these values move).

Rules (from BUILD_PLAN.md):
  +10  accepted new report    — citizen opened a fresh thread
  +5   clustered report       — report folded into an existing thread (reach signal)
  +20  issue resolved         — every contributing citizen earns this
  -10  credibility ding       — AI gate rejected the photo as not a real public issue

Keeping these as named constants means a juror asking "how much do I earn?"
gets a one-line answer from this file, not a grep through route handlers.
"""

from __future__ import annotations

# ── Award amounts (adjust freely — they're just config) ──────────────────────

COINS_NEW_REPORT = 10    # photo accepted, new thread opened
COINS_CLUSTERED  = 5     # photo accepted, joined an existing thread
COINS_RESOLVED   = 20    # issue officially closed — every contributor earns this

CREDIBILITY_DING      = 10   # deducted per irrelevant-photo rejection
CREDIBILITY_THRESHOLD = 30   # below this, new submissions are blocked (anti-spam)


# ── Public API ────────────────────────────────────────────────────────────────

def award_new_report(user) -> None:
    """Citizen submitted an accepted report that opened a fresh issue thread."""
    user.coins += COINS_NEW_REPORT


def award_clustered(user) -> None:
    """Citizen's report was folded into an existing open thread."""
    user.coins += COINS_CLUSTERED


def award_resolved(users: list) -> None:
    """Issue marked resolved — every citizen who contributed a report earns coins."""
    for u in users:
        u.coins += COINS_RESOLVED


def ding_credibility(user) -> None:
    """
    AI relevance gate rejected the photo.
    Credibility floors at 0 — it never goes negative.
    """
    user.credibility = max(0, user.credibility - CREDIBILITY_DING)


def is_throttled(user) -> bool:
    """Return True if the user's credibility is too low to submit new reports."""
    return user.credibility < CREDIBILITY_THRESHOLD
