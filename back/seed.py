"""
seed.py — Seed 25-30 sample reports clustered into ~15 issues around Nərimanov.
Run once before starting the backend:
    cd back && OPENWAVE_MOCK=1 python seed.py
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

os.environ["OPENWAVE_MOCK"] = "1"

from sqlmodel import Session, select

from models import engine, init_db, User, Issue, Report, Organization
from enums import Category, IssueStatus, Severity
from taxonomy import compute_deadline, suggest_org
from clustering import ThreadCandidate, find_thread, priority_score


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ── Clean slate ──────────────────────────────────────────────────────────────
init_db()
session = Session(engine)

# Truncate existing data
for r in session.exec(select(Report)).all():
    session.delete(r)
for i in session.exec(select(Issue)).all():
    session.delete(i)
for u in session.exec(select(User)).all():
    session.delete(u)
session.commit()
print("Cleared existing data.")

# ── Register citizens ────────────────────────────────────────────────────────
users = {}
for name in ["Anar Məmmədov", "Leyla Məmmədova", "Rəşad Əliyev",
             "Fərid Qasımov", "Kamil Vəliyev", "Aysel Hüseynova"]:
    u = User(display_name=name, coins=0)
    session.add(u)
    session.flush()
    users[name] = u.id

session.commit()
print(f"Registered {len(users)} citizens.")

# ── Sample image URLs (picsum placeholder) ───────────────────────────────────
IMG = "https://picsum.photos/seed/{}/400/300"

# ── Report definitions ───────────────────────────────────────────────────────
# (lat, lng, category, severity, title_az, desc_az, user_name, status_override, tags)
reports_data = [
    # ═══ CLUSTER 1: Road surface damage — İnşaatçılar prospekti ═══
    # All ~same location (40.4093, 49.8671), same category → should cluster into 1 issue
    (40.4093, 49.8671, Category.ROAD_SURFACE, Severity.HIGH,
     "Asfalt örtüyü dağılıb", "İnşaatçılar prospektində əsas yolda dərin çuxur yaranıb. Nəqliyyat vasitələri üçün ciddi təhlükə.",
     "Anar Məmmədov", None, ["asfalt", "çuxur", "yol", "təhlükə"]),
    (40.4094, 49.8672, Category.ROAD_SURFACE, Severity.HIGH,
     "Yolun vəziyyəti pisləşib", "Çuxur daha da böyüyüb, yağışdan sonra su dolub. Bir neçə maşın zədələnib.",
     "Leyla Məmmədova", IssueStatus.ROUTED, ["asfalt", "çuxur", "su"]),
    (40.4092, 49.8670, Category.ROAD_SURFACE, Severity.HIGH,
     "Təcili asfalt təmiri lazımdır", "Küçənin bu hissəsində asfalt tamamilə qopub, çınqıl görünür.",
     "Rəşad Əliyev", IssueStatus.IN_PROGRESS, ["asfalt", "təcili"]),

    # ═══ CLUSTER 2: Waste / trash — Gənclik metro ═══
    (40.4040, 49.8720, Category.WASTE, Severity.MEDIUM,
     "Zibil konteynerləri daşıb", "Gənclik metro stansiyası qarşısındakı zibil konteynerləri 5 gündür boşaldılmır.",
     "Fərid Qasımov", None, ["zibil", "konteyner", "metro"]),
    (40.4041, 49.8721, Category.WASTE, Severity.MEDIUM,
     "Üfunət ətrafa yayılır", "Zibil konteynerlərinin ətrafına məişət tullantıları atılıb, siçovullar artıb.",
     "Aysel Hüseynova", IssueStatus.ROUTED, ["zibil", "siçovul", "antisanitar"]),
    (40.4039, 49.8719, Category.WASTE, Severity.MEDIUM,
     "Tullantı problemi həll olunmayıb", "Hələ də zibil yığışdırılmayıb, vəziyyət daha da pisləşib.",
     "Kamil Vəliyev", None, ["zibil", "gecikmə"]),

    # ═══ CLUSTER 3: Lighting — Mirzə Fətəli küç ═══
    (40.4120, 49.8620, Category.LIGHTING, Severity.HIGH,
     "İşıq dirəkləri işləmir", "Mirzə Fətəli küçəsində 3 ədəd işıq dirəyi iki həftədir sönükdür.",
     "Kamil Vəliyev", None, ["işıq", "dirək", "gecə"]),
    (40.4121, 49.8621, Category.LIGHTING, Severity.HIGH,
     "Küçə qaranlıqdır", "Gecə vaxtı küçə tamamilə qaranlıq olur, piyadalar üçün təhlükəlidir.",
     "Anar Məmmədov", IssueStatus.RESOLVED, ["işıq", "qaranlıq", "piyada"]),

    # ═══ CLUSTER 4: Fountain — Park ═══
    (40.4070, 49.8700, Category.FOUNTAIN, Severity.MEDIUM,
     "Fontan işləmir", "Parkdakı fontanın su təzyiqi zəifləyib, bəzi fəvvarələr ümumiyyətlə işləmir.",
     "Aysel Hüseynova", None, ["fontan", "su", "park"]),
    (40.4071, 49.8701, Category.FOUNTAIN, Severity.MEDIUM,
     "Fontan nasazlığı", "Fontanın mühərriki sıradan çıxıb, su səviyyəsi aşağı düşüb.",
     "Leyla Məmmədova", IssueStatus.IN_PROGRESS, ["fontan", "nasazlıq"]),

    # ═══ CLUSTER 5: Sidewalk damage — Atatürk prospekti ═══
    (40.4150, 49.8580, Category.SIDEWALK, Severity.HIGH,
     "Səki plitələri dağılıb", "Atatürk prospekti boyu 150 metr məsafədə səki plitələri qırılıb.",
     "Rəşad Əliyev", None, ["səki", "plita", "piyada"]),
    (40.4151, 49.8581, Category.SIDEWALK, Severity.HIGH,
     "Yaşlılar keçə bilmir", "Səki dağıldığı üçün yaşlı sakinlər yoldan keçməkdə çətinlik çəkir.",
     "Fərid Qasımov", IssueStatus.RESOLVED, ["səki", "yaşlı", "əlillik"]),

    # ═══ CLUSTER 6: Green zone — Nərimanov bağı ═══
    (40.4180, 49.8550, Category.GREEN_ZONE, Severity.LOW,
     "Otlar basıb", "Nərimanov qəsəbə bağında otlar 1 metr hündürlüyə çatıb.",
     "Anar Məmmədov", None, ["ot", "bağ", "baxımsız"]),
    (40.4181, 49.8552, Category.GREEN_ZONE, Severity.LOW,
     "İlan və həşərat yuvaları", "Uzun otlar səbəbindən parka giriş təhlükəli hala gəlib.",
     "Aysel Hüseynova", IssueStatus.ROUTED, ["ilan", "park", "təhlükə"]),

    # ═══ CLUSTER 7: Flooding / drainage ═══
    (40.4110, 49.8560, Category.FLOODING, Severity.HIGH,
     "Yağış drenajı tıxanıb", "Gənclik prospektində drenaj yarpaqla tıxanıb, yol su altında qalır.",
     "Fərid Qasımov", None, ["drenaj", "yağış", "su"]),
    (40.4111, 49.8562, Category.FLOODING, Severity.HIGH,
     "Su 30 sm hündürlüyə çatıb", "Hər yağışda yol bağlanır, maşınlar keçə bilmir.",
     "Leyla Məmmədova", IssueStatus.IN_PROGRESS, ["su", "yol", "yağış"]),

    # ═══ STANDALONE REPORTS (no cluster — different categories/locations) ═══
    (40.4020, 49.8780, Category.SIGNAGE, Severity.LOW,
     "Reklam lövhəsi qanunsuzdur", "Təbriz küçəsindəki məktəbin fasadında icazəsiz reklam lövhəsi asılıb.",
     "Kamil Vəliyev", None, ["reklam", "lövhə", "məktəb"]),

    (40.4140, 49.8730, Category.PARK_EQUIPMENT, Severity.HIGH,
     "Uşaq yelləncəyi sınıb", "Parkdakı yelləncək qırılıb, sürüşmə qülləsi paslanıb.",
     "Aysel Hüseynova", None, ["yelləncək", "uşaq", "park"]),

    (40.4000, 49.8800, Category.CONSTRUCTION_FENCE, Severity.LOW,
     "Tikinti hasarı yıxılıb", "Gənclik yaşayış massivindəki tikinti hasarı uçub, piyada keçidi bağlanıb.",
     "Rəşad Əliyev", IssueStatus.RESOLVED, ["hasar", "tikinti"]),

    (40.4200, 49.8600, Category.ROAD_EXCAVATION, Severity.MEDIUM,
     "Qazılmış asfalt bərpa edilməyib", "Cavad Xan küçəsində boru təmiri üçün qazılmış asfalt 3 həftədir açıq qalıb.",
     "Anar Məmmədov", None, ["asfalt", "qazıntı", "boru"]),

    (40.4160, 49.8680, Category.CLEANLINESS, Severity.MEDIUM,
     "Küçə süpürülməyib", "Nərimanov parkı ətrafındakı küçələr bir həftədir təmizlənmir.",
     "Leyla Məmmədova", None, ["təmizlik", "küçə"]),

    (40.4080, 49.8750, Category.STOREFRONT, Severity.LOW,
     "Vitrin görkəmi qaydalara uyğun deyil", "Gənclik prospektindəki mağazanın vitrini dağılmış vəziyyətdədir.",
     "Fərid Qasımov", None, ["vitrin", "mağaza"]),

    (40.4060, 49.8640, Category.ICE, Severity.HIGH,
     "Səkidə buzlaşma var", "Nərimanov prospektində su borusu sızması səbəbindən səki donub.",
     "Kamil Vəliyev", IssueStatus.IN_PROGRESS, ["buz", "səki", "qış"]),

    (40.4100, 49.8500, Category.FACADE, Severity.LOW,
     "Bina fasadı uçub", "Atatürk parkı yaxınlığındakı binanın fasadından material qopub.",
     "Aysel Hüseynova", None, ["fasad", "bina"]),

    (40.4030, 49.8660, Category.LIGHTING, Severity.MEDIUM,
     "Park işıqlandırması sönüb", "Mərkəzi parkdakı dekorativ işıqların yarısı işləmir.",
     "Rəşad Əliyev", None, ["işıq", "park", "dekorativ"]),

    (40.4220, 49.8530, Category.ROAD_SURFACE, Severity.MEDIUM,
     "Ulduz metro ətrafı yol qopub", "Ulduz metrosu yaxınlığında asfalt qopub, çınqıl açılıb.",
     "Anar Məmmədov", None, ["asfalt", "metro", "ulduz"]),
]

# ── Insert all reports with clustering logic ─────────────────────────────────
existing_issues: list = []  # keep track of created issues for clustering
total_reports = 0

for lat, lng, cat, sev, title, desc, uname, status_override, tags in reports_data:
    user_id = users[uname]

    # Compute deadline + default org
    deadline = compute_deadline(cat, sev)
    org = suggest_org(cat)

    # Clustering: check nearby existing issues of same category
    all_issues = session.exec(select(Issue)).all()
    candidates = [
        ThreadCandidate(str(i.id), i.category, i.status, i.lat, i.lng)
        for i in all_issues
        if abs(i.lat - lat) <= 0.002 and abs(i.lng - lng) <= 0.002
    ]
    matched = find_thread(lat, lng, cat, candidates)

    status = status_override or IssueStatus.MANUAL_REVIEW

    if matched:
        issue = session.get(Issue, int(matched.id))
        if not issue:
            # fallback: create new
            issue = Issue(
                category=cat, severity=sev, title_az=title, description_az=desc,
                lat=lat, lng=lng, status=status, deadline=deadline,
                org_key=org.key, tags=tags,
            )
            session.add(issue)
            session.flush()
        else:
            issue.report_count += 1
            session.add(issue)
            session.flush()
    else:
        issue = Issue(
            category=cat, severity=sev, title_az=title, description_az=desc,
            lat=lat, lng=lng, status=status, deadline=deadline,
            org_key=org.key, tags=tags,
        )
        session.add(issue)
        session.flush()

    # Create report
    report = Report(
        user_id=user_id, issue_id=issue.id,
        image_url=IMG.format(uuid.uuid4().hex[:8]),
        user_text=desc, lat=lat, lng=lng,
        ai_is_relevant=True, ai_category=cat, ai_severity=sev,
        ai_confidence=0.85, ai_raw={"seed": True},
    )
    session.add(report)
    session.flush()

    if not issue.root_report_id:
        issue.root_report_id = report.id

    # Recompute priority
    issue.priority = priority_score(issue.severity, issue.report_count,
                                    issue.created_at or _utcnow())
    issue.updated_at = _utcnow()
    session.add(issue)

    total_reports += 1

session.commit()

# ── Award some coins to users ─────────────────────────────────────────────────
user_rows = session.exec(select(User)).all()
for u in user_rows:
    u.coins = 10 * u.id % 200 + 50  # varied coin amounts for marketplace demo
    session.add(u)
session.commit()

# ── Summary ───────────────────────────────────────────────────────────────────
issues = session.exec(select(Issue)).all()
clustered = sum(1 for i in issues if i.report_count > 1)
report_count = len(session.exec(select(Report)).all())
print(f"\nSeeded {report_count} reports across {len(issues)} issues.")
print(f"  Clustered issues (2+ reports): {clustered}")
print(f"  Users: {len(session.exec(select(User)).all())}")
print(f"  Organizations: {len(session.exec(select(Organization)).all())}")
print("\nStatus breakdown:")
by_status: dict[str, int] = {}
for i in issues:
    by_status[i.status.value] = by_status.get(i.status.value, 0) + 1
for k, v in sorted(by_status.items()):
    print(f"  {k}: {v}")
print("\nCategory breakdown:")
by_cat: dict[str, int] = {}
for i in issues:
    by_cat[i.category.value] = by_cat.get(i.category.value, 0) + 1
for k, v in sorted(by_cat.items(), key=lambda x: -x[1]):
    print(f"  {k}: {v}")
print("\nDone. Start the server with: OPENWAVE_MOCK=1 uvicorn main:app --reload --port 8000")
