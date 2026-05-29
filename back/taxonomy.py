"""
taxonomy.py — THE ROUTING + DEADLINE BRAIN (config, not AI).

This is the part that makes "deadline prediction" defensible in Q&A. The AI does
NOT predict a date. The AI only classifies (category + severity). The deadline is
then computed deterministically from a table you can read out loud:

    deadline = report_time + SLA_DAYS[category][severity]

Same for routing: the AI *suggests* an org, but the authoritative mapping lives
here, so a juror asking "where does a flooding report go?" gets a real, fixed
answer (Azərsu), not a model guess.

Org names below are real bodies operating in Baku / under Nərimanov IH
(verified, not invented). DISTRICT-internal bodies are marked so the demo can
say "this stays inside Nərimanov IH" vs "this is escalated to a city utility".
"""

from dataclasses import dataclass
from datetime import datetime, timedelta

from enums import Category, Severity


@dataclass(frozen=True)
class Org:
    key: str
    name_az: str
    scope: str          # "district" (inside Nərimanov IH) | "city_utility" | "city_service"
    contact_hint: str   # what the routing notification would target (mock for demo)


# --- The real responsible bodies -------------------------------------------------
ORGS: dict[str, Org] = {
    "mktb": Org(
        "mktb", "Nərimanov rayon Mənzil-Kommunal Təsərrüfatı Birliyi",
        "district", "nerimanov-mktb@.gov.az",
    ),
    "abadliq": Org(
        "abadliq", "Nərimanov RİH — Abadlıq və Kommunal Təsərrüfat şöbəsi",
        "district", "abadliq@nerimanov-ih.gov.az",
    ),
    "tikinti": Org(
        "tikinti", "Nərimanov RİH — Tikinti və Arxitektura şöbəsi",
        "district", "tikinti@nerimanov-ih.gov.az",
    ),
    "azersu": Org(
        "azersu", "“Azərsu” ASC",
        "city_utility", "104 / qaynar xətt",
    ),
    "azeriqaz": Org(
        "azeriqaz", "“Azəriqaz” İstehsalat Birliyi",
        "city_utility", "104 / qaynar xətt",
    ),
    "azerisiq": Org(
        "azerisiq", "“Azərişıq” ASC",
        "city_utility", "920 / qaynar xətt",
    ),
    "bakiisiq": Org(
        "bakiisiq", "“Bakıişıq” MMC (küçə işıqlandırması)",
        "city_service", "bakiisiq@.gov.az",
    ),
    "temiz_seher": Org(
        "temiz_seher", "“Təmiz Şəhər” ASC",
        "city_service", "temizseher@.gov.az",
    ),
    "yasilliq": Org(
        "yasilliq", "Bakı Şəhər Yaşıllaşdırma Təsərrüfatı Birliyi",
        "city_service", "Xan Şuşinski 63, Nərimanov r.",
    ),
}


# --- category -> default responsible org ----------------------------------------
# (The operator can reassign in the dashboard; this is the smart default.)
CATEGORY_TO_ORG: dict[Category, str] = {
    Category.FACADE:             "mktb",
    Category.GREEN_ZONE:         "yasilliq",
    Category.FLOODING:           "azersu",
    Category.ICE:                "abadliq",
    Category.CLEANLINESS:        "temiz_seher",
    Category.WASTE:              "temiz_seher",
    Category.ROAD_EXCAVATION:    "azersu",   # most dug-up asphalt = water/sewage works; reassign to azeriqaz if gas
    Category.ROAD_SURFACE:       "abadliq",
    Category.SIGNAGE:            "tikinti",
    Category.STOREFRONT:         "tikinti",
    Category.PARK_EQUIPMENT:     "abadliq",
    Category.FOUNTAIN:           "abadliq",
    Category.SIDEWALK:           "abadliq",
    Category.CONSTRUCTION_FENCE: "tikinti",
    Category.LIGHTING:           "bakiisiq",
    Category.OTHER:              "abadliq",   # nominal; OTHER always hits manual review anyway
}


# --- SLA matrix:  days to resolve, by category x severity -----------------------
# Read this as policy: "an icy sidewalk (HIGH) must be cleared within 1 day;
# a faded facade (LOW) within 45 days." These numbers are the deadline.
# Tune freely — they're just config.
SLA_DAYS: dict[Category, dict[Severity, int]] = {
    Category.FACADE:             {Severity.LOW: 45, Severity.MEDIUM: 21, Severity.HIGH: 10},
    Category.GREEN_ZONE:         {Severity.LOW: 14, Severity.MEDIUM: 7,  Severity.HIGH: 3},
    Category.FLOODING:           {Severity.LOW: 3,  Severity.MEDIUM: 1,  Severity.HIGH: 1},
    Category.ICE:                {Severity.LOW: 2,  Severity.MEDIUM: 1,  Severity.HIGH: 1},
    Category.CLEANLINESS:        {Severity.LOW: 5,  Severity.MEDIUM: 2,  Severity.HIGH: 1},
    Category.WASTE:              {Severity.LOW: 4,  Severity.MEDIUM: 2,  Severity.HIGH: 1},
    Category.ROAD_EXCAVATION:    {Severity.LOW: 14, Severity.MEDIUM: 7,  Severity.HIGH: 3},
    Category.ROAD_SURFACE:       {Severity.LOW: 30, Severity.MEDIUM: 14, Severity.HIGH: 7},
    Category.SIGNAGE:            {Severity.LOW: 21, Severity.MEDIUM: 14, Severity.HIGH: 7},
    Category.STOREFRONT:         {Severity.LOW: 21, Severity.MEDIUM: 14, Severity.HIGH: 7},
    Category.PARK_EQUIPMENT:     {Severity.LOW: 14, Severity.MEDIUM: 7,  Severity.HIGH: 2},  # broken swing = child safety
    Category.FOUNTAIN:           {Severity.LOW: 21, Severity.MEDIUM: 10, Severity.HIGH: 5},
    Category.SIDEWALK:           {Severity.LOW: 30, Severity.MEDIUM: 14, Severity.HIGH: 5},
    Category.CONSTRUCTION_FENCE: {Severity.LOW: 21, Severity.MEDIUM: 10, Severity.HIGH: 5},
    Category.LIGHTING:           {Severity.LOW: 10, Severity.MEDIUM: 5,  Severity.HIGH: 2},
    Category.OTHER:              {Severity.LOW: 14, Severity.MEDIUM: 7,  Severity.HIGH: 3},
}


def suggest_org(category: Category) -> Org:
    """The smart default org for a category (operator may override)."""
    return ORGS[CATEGORY_TO_ORG[category]]


def compute_deadline(category: Category, severity: Severity,
                     start: datetime | None = None) -> datetime:
    """
    The transparent deadline. NOT an AI prediction — a table lookup.
    start defaults to now (report time).
    """
    start = start or datetime.utcnow()
    return start + timedelta(days=SLA_DAYS[category][severity])


def sla_days(category: Category, severity: Severity) -> int:
    return SLA_DAYS[category][severity]
