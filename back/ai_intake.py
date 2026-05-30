"""
ai_intake.py — THE DIFFERENTIATOR (single Grok vision call, structured JSON out).

Provider: xAI Grok (OpenAI-compatible API at https://api.x.ai/v1).
One model call per submission does ALL of the intake reasoning at once, using BOTH
the citizen's photo AND the citizen's typed description:
    relevance gate -> category -> severity -> short AZ title + description
    -> dedup tags (for threading)

Why one call (read this before anyone suggests training YOLO):
  - zero-shot: works on day 1 with no labeled Nərimanov dataset
  - returns *reasoning* (title, description, tags), not just bounding boxes
  - uses the citizen's words as context, so a vague photo + "fontan işləmir"
    still classifies correctly
  - hits the rubric's "creative AI use" (Innovation 15 + Texniki İcra 30)

What this module does NOT do:
  - it does NOT predict a deadline. The caller computes that from taxonomy.py
    (a transparent table), so Q&A "how do you get the date?" has a real answer.
  - it does NOT make the final decision. Output always goes to MANUAL_REVIEW;
    the operator approves/overrides.

MOCK_MODE lets the frontend dev build against this with no API key
(set OPENWAVE_MOCK=1). Real mode calls Grok (needs XAI_API_KEY).
"""

from __future__ import annotations

import base64
import json
import os
from dataclasses import dataclass, field, asdict

from enums import Category, Severity

# ---------------------------------------------------------------------------

# xAI's current GA multimodal model (text+image). Slugs rotate — confirm the
# live name at https://docs.x.ai/developers/models and change only this line.
VISION_MODEL = "grok-4.3"
XAI_BASE_URL = "https://api.x.ai/v1"
MOCK = os.getenv("OPENWAVE_MOCK") == "1"

_CATEGORY_GUIDE = "\n".join(
    f'  - "{c.value}": {c.label_az}' for c in Category if c is not Category.OTHER
)

SYSTEM_PROMPT = f"""Sən Nərimanov rayonu üçün şəhər problemlərini qeydə alan sistemin analiz mühərriksən.
Sənə vətəndaşın çəkdiyi BİR şəkil və ONUN yazdığı qısa təsvir veriləcək.
Hər ikisini nəzərə alıb şəkli analiz et və YALNIZ JSON qaytar.
Qərarı əsasən ŞƏKİL üzərində ver; mətn yalnız kontekst üçündür (mətn şəkillə uyğun
olmaya və ya boş ola bilər).

ƏVVƏLCƏ uyğunluq yoxlaması (relevance gate):
Şəkil ictimai ərazidə görünən, bələdiyyə/kommunal səviyyəli REAL problemi göstərməlidir
(fasad, yaşıllıq, subasma, buzlaşma, zibil, asfalt, səki, işıqlandırma, park avadanlığı və s.).
Əgər şəkil selfie, qapalı məkan, yemək, sənəd/ekran şəkli, mesaj, heyvan, və ya
heç bir ictimai problemi göstərmirsə -> "is_relevant": false.

JSON sxeması (tam bu açarlar):
{{
  "is_relevant": boolean,
  "rejection_reason_az": string,   // is_relevant=false olduqda 1 cümlə, əks halda ""
  "category": one of [{", ".join(f'"{c.value}"' for c in Category if c is not Category.OTHER)}],
  "severity": "low" | "medium" | "high",
  "confidence": number,            // 0.0–1.0, kateqoriya əminliyi
  "title_az": string,              // qısa başlıq, maks 8 söz
  "description_az": string,        // 1–2 cümlə, görünən problemi təsvir et (vətəndaşın mətnini nəzərə al)
  "tags": [string]                 // 3–6 açar söz (təkrarların qruplaşması üçün), AZ
}}

Kateqoriyalar:
{_CATEGORY_GUIDE}

Şiddət (severity) qaydaları:
  - high: dərhal təhlükə/maneə (subasma, buzlaşma, sınmış uşaq atraksionu, açıq quyu)
  - medium: funksiyaya təsir edən, lakin təcili təhlükə olmayan
  - low: əsasən estetik/görkəm (rəng solması, vitrin görkəmi)

Qaydalar:
  - Əmin deyilsənsə category üçün ən yaxınını seç, confidence-i aşağı qoy.
  - YALNIZ JSON qaytar, başqa heç nə (markdown, izah yox)."""


@dataclass
class IntakeResult:
    """Structured output of the intake call. The API layer serializes this."""
    is_relevant: bool
    rejection_reason_az: str = ""
    category: Category = Category.OTHER
    severity: Severity = Severity.MEDIUM
    confidence: float = 0.0
    title_az: str = ""
    description_az: str = ""
    tags: list[str] = field(default_factory=list)
    needs_manual_review: bool = True   # always True by design; kept explicit
    raw: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["category"] = self.category.value
        d["severity"] = self.severity.value
        return d


# --- parsing / validation --------------------------------------------------

def _coerce(payload: dict) -> IntakeResult:
    """Validate model JSON against our enums; never trust it blindly."""
    relevant = bool(payload.get("is_relevant", False))
    if not relevant:
        return IntakeResult(
            is_relevant=False,
            rejection_reason_az=str(payload.get("rejection_reason_az", "Şəkil ictimai problemi göstərmir.")),
            raw=payload,
        )

    try:
        category = Category(payload.get("category", "other"))
    except ValueError:
        category = Category.OTHER
    try:
        severity = Severity(payload.get("severity", "medium"))
    except ValueError:
        severity = Severity.MEDIUM
    try:
        confidence = max(0.0, min(1.0, float(payload.get("confidence", 0.0))))
    except (TypeError, ValueError):
        confidence = 0.0

    tags = payload.get("tags", [])
    if not isinstance(tags, list):
        tags = []
    tags = [str(t).strip().lower() for t in tags if str(t).strip()][:6]

    return IntakeResult(
        is_relevant=True,
        category=category,
        severity=severity,
        confidence=confidence,
        title_az=str(payload.get("title_az", "")).strip(),
        description_az=str(payload.get("description_az", "")).strip(),
        tags=tags,
        raw=payload,
    )


_MOCK_TITLES: dict[str, str] = {
    "road_surface":       "Asfalt örtüyü zədəlidir",
    "road_excavation":    "Qazılmış asfalt bərpa edilməyib",
    "sidewalk":           "Səki plitələri qırılıb",
    "lighting":           "Küçə işıqlandırması işləmir",
    "waste":              "Zibil konteynerləri dolub",
    "cleanliness":        "Küçə uzun müddətdir süpürülməyib",
    "flooding":           "Drenaj tıxanıb, su yığılır",
    "ice":                "Səkidə təhlükəli buzlaşma var",
    "green_zone":         "Yaşıllıq sahəsi baxımsız vəziyyətdədir",
    "park_equipment":     "Park avadanlığı sıradan çıxıb",
    "fountain":           "Fontan işləmir",
    "facade":             "Bina fasadından material qopub",
    "signage":            "Qanunsuz reklam lövhəsi asılıb",
    "storefront":         "Mağaza vitrini qaydalara uyğun deyil",
    "construction_fence": "Tikinti hasarı yıxılıb",
}

def _mock(image_bytes: bytes, user_text: str) -> IntakeResult:
    """Deterministic fake so the frontend can build with no API key."""
    cats = [c for c in Category if c is not Category.OTHER]
    c = cats[len(image_bytes) % len(cats)]
    sev = [Severity.LOW, Severity.MEDIUM, Severity.HIGH][len(image_bytes) % 3]
    title = user_text.strip()[:60] if user_text.strip() else _MOCK_TITLES.get(c.value, c.label_az)
    desc = user_text.strip() or f"Nərimanov rayonunda aşkar edilmiş {c.label_az.lower()} problemi."
    return IntakeResult(
        is_relevant=True, category=c, severity=sev, confidence=0.83,
        title_az=title,
        description_az=desc,
        tags=[c.value, sev.value],
        raw={"mock": True, "user_text": user_text},
    )


# --- the public entry point ------------------------------------------------

def analyze_image(image_bytes: bytes, mime_type: str = "image/jpeg",
                  user_text: str = "") -> IntakeResult:
    """
    Run the intake call on one photo + the citizen's typed description.

    Caller is responsible AFTER this for:
      1. if not result.is_relevant -> reject report + ding credibility score
      2. else -> compute deadline via taxonomy.compute_deadline(category, severity)
                 + route via taxonomy.suggest_org(category)
                 + create issue/report (store user_text on the Report) in MANUAL_REVIEW
    """
    if MOCK:
        return _mock(image_bytes, user_text)

    # OpenAI-compatible SDK pointed at xAI. pip install openai
    from openai import OpenAI

    client = OpenAI(api_key=os.environ["XAI_API_KEY"], base_url=XAI_BASE_URL)
    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    citizen_text = user_text.strip() or "(vətəndaş mətn yazmayıb)"

    resp = client.chat.completions.create(
        model=VISION_MODEL,
        max_tokens=600,
        response_format={"type": "json_object"},   # JSON mode (OpenAI-compatible)
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": [
                # text precedes image (Grok recommends this ordering)
                {"type": "text", "text": f"Vətəndaşın təsviri: {citizen_text}\nBu şəkli analiz et və yalnız JSON qaytar."},
                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
            ]},
        ],
    )

    text = (resp.choices[0].message.content or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text[4:] if text.lower().startswith("json") else text
        text = text.strip()

    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        # never crash the upload path; force manual review
        return IntakeResult(
            is_relevant=True, category=Category.OTHER, severity=Severity.MEDIUM,
            confidence=0.0, title_az="Avtomatik analiz alınmadı",
            description_az=(user_text.strip() or "Şəkil analiz edilə bilmədi, operator yoxlaması tələb olunur."),
            raw={"parse_error": text[:400]},
        )

    return _coerce(payload)
