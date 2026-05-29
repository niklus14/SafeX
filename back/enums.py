"""
enums.py — THE SHARED CONTRACT.

Both the admin dashboard and the citizen app import status/severity/category
from here. This file is the single source of truth: if a value isn't here,
neither side may invent it. Keys are stable ENGLISH identifiers (safe for code,
DB, and API). Display strings are AZERBAIJANI (what the user/jury actually see).

Rule of thumb for the team:
  - In code / DB / JSON  -> use the .value (e.g. "in_progress")
  - In any UI            -> use the .label_az (e.g. "İcradadır")
"""

from enum import Enum


class IssueStatus(str, Enum):
    """
    The lifecycle of a single ISSUE (a thread root), shared verbatim by:
      - admin pipeline (what the operator acts on)
      - citizen progress tracker (the stepper the reporter watches)

    Order below IS the forward order of the pipeline. REJECTED is terminal
    and off-pipeline (reachable only from AI_REVIEW or MANUAL_REVIEW).
    """
    AI_REVIEW = "ai_review"          # photo received, model is structuring it
    MANUAL_REVIEW = "manual_review"  # awaiting operator approval of AI output
    ROUTED = "routed"                # approved + sent to responsible org
    IN_PROGRESS = "in_progress"      # org has acknowledged / work started
    RESOLVED = "resolved"            # closed, fixed
    REJECTED = "rejected"            # off-pipeline; not a real territorial issue

    @property
    def label_az(self) -> str:
        return {
            "ai_review": "Süni intellekt yoxlaması",
            "manual_review": "Operator yoxlaması",
            "routed": "Quruma yönləndirildi",
            "in_progress": "İcradadır",
            "resolved": "Həll edildi",
            "rejected": "İmtina edildi",
        }[self.value]

    @property
    def is_terminal(self) -> bool:
        return self in (IssueStatus.RESOLVED, IssueStatus.REJECTED)


# Forward steps shown in the citizen stepper (REJECTED is rendered separately,
# as a red terminal state, not as a step).
CITIZEN_PIPELINE = [
    IssueStatus.AI_REVIEW,
    IssueStatus.MANUAL_REVIEW,
    IssueStatus.ROUTED,
    IssueStatus.IN_PROGRESS,
    IssueStatus.RESOLVED,
]


class Severity(str, Enum):
    """
    Severity drives the SLA (deadline) and the priority score. The AI proposes
    it; the operator can override it. We keep it to 3 buckets on purpose —
    a 1–10 scale is impossible to defend in Q&A, three buckets are obvious.
    """
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

    @property
    def label_az(self) -> str:
        return {"low": "Aşağı", "medium": "Orta", "high": "Yüksək"}[self.value]

    @property
    def weight(self) -> int:
        """Used by the priority score in threading.py."""
        return {"low": 1, "medium": 2, "high": 3}[self.value]


class Category(str, Enum):
    """
    Pulled DIRECTLY from the organizers' right-hand panel ("Aşağıda göstərilən
    hallar ərazi üzrə problem kimi nəzərdə tutulur"). These are pre-validated by
    Nərimanov IH, so we don't invent categories — we mirror theirs. Each maps to
    an SLA and a responsible org in taxonomy.py.
    """
    FACADE = "facade"                      # fasad: rəng solması, material qopması
    GREEN_ZONE = "green_zone"              # yaşıllıq: saralma, biçilməmə, ağacəkmə
    FLOODING = "flooding"                  # subasma (intensiv yağıntı)
    ICE = "ice"                            # səki/küçədə buzlaşma
    CLEANLINESS = "cleanliness"            # küçə/səki təmizliyi
    WASTE = "waste"                        # zibil konteynerləri
    ROAD_EXCAVATION = "road_excavation"    # qazılmış asfaltın bərpa edilməməsi
    ROAD_SURFACE = "road_surface"          # asfalt örtüyünün yenilənməsi
    SIGNAGE = "signage"                    # reklam lövhələri
    STOREFRONT = "storefront"              # iaşə/ticarət vitrinləri
    PARK_EQUIPMENT = "park_equipment"      # uşaq/idman atraksionları, skamyalar
    FOUNTAIN = "fountain"                  # fontanların işləkliyi
    SIDEWALK = "sidewalk"                  # səki örtüyü, bardürlər
    CONSTRUCTION_FENCE = "construction_fence"  # tikinti hasarlarının görkəmi
    LIGHTING = "lighting"                  # işıq dirəkləri, işıqlandırma
    OTHER = "other"                        # AI fallback only; forces manual review

    @property
    def label_az(self) -> str:
        return {
            "facade": "Bina fasadı",
            "green_zone": "Yaşıllıq zonası",
            "flooding": "Subasma",
            "ice": "Buzlaşma",
            "cleanliness": "Təmizlik",
            "waste": "Zibil konteynerləri",
            "road_excavation": "Qazılmış asfalt (bərpa)",
            "road_surface": "Asfalt örtüyü",
            "signage": "Reklam lövhələri",
            "storefront": "Vitrinlər",
            "park_equipment": "Park avadanlığı",
            "fountain": "Fontanlar",
            "sidewalk": "Səki və bardürlər",
            "construction_fence": "Tikinti hasarları",
            "lighting": "İşıqlandırma",
            "other": "Digər",
        }[self.value]
