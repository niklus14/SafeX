"""
seed.py — Comprehensive seed with large clusters + topic-relevant images.
Run once:  cd back && OPENWAVE_MOCK=1 python seed.py
"""
from __future__ import annotations
import os, uuid
from datetime import datetime, timezone

os.environ["OPENWAVE_MOCK"] = "1"

from sqlmodel import Session, select
from models import engine, init_db, User, Issue, Report, Organization
from enums import Category, IssueStatus, Severity
from taxonomy import compute_deadline, suggest_org
from clustering import ThreadCandidate, find_thread, priority_score
from sqlmodel import SQLModel


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ── Recreate schema ───────────────────────────────────────────────────────────
SQLModel.metadata.drop_all(engine)
init_db()
session = Session(engine)
print("Schema recreated.")

# ── Citizens ──────────────────────────────────────────────────────────────────
CITIZEN_NAMES = [
    "Anar Məmmədov", "Leyla Həsənova", "Rəşad Əliyev", "Fərid Qasımov",
    "Kamil Vəliyev", "Aysel Hüseynova", "Murad Babayev", "Nərmin İsgəndərova",
]
users: dict[str, int] = {}
for name in CITIZEN_NAMES:
    u = User(display_name=name, coins=0)
    session.add(u); session.flush()
    users[name] = u.id
session.commit()
print(f"Registered {len(users)} citizens.")

# ── Image helpers — Unsplash topic-matched photos ─────────────────────────────
# Format: ?auto=format&fit=crop&w=800&h=450 keeps aspect ratio and quality.
# Each cluster gets its own photo series (r1, r2 …) for visual variety.
IMGS = {
    # Road / pothole cluster
    "road1":   "https://images.unsplash.com/photo-1558618047-3e9b3e0c3aba?auto=format&fit=crop&w=800&h=450",
    "road2":   "https://images.unsplash.com/photo-1579613832111-ac7dfcc4723f?auto=format&fit=crop&w=800&h=450",
    "road3":   "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&h=450",
    "road4":   "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&h=450",
    "road5":   "https://images.unsplash.com/photo-1531171074112-91f7d13f0562?auto=format&fit=crop&w=800&h=450",

    # Waste / trash cluster
    "waste1":  "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=800&h=450",
    "waste2":  "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&h=450",
    "waste3":  "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&h=450",
    "waste4":  "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&h=450",
    "waste5":  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&h=450",

    # Lighting cluster
    "light1":  "https://images.unsplash.com/photo-1543599723-d76e2b97c7f2?auto=format&fit=crop&w=800&h=450",
    "light2":  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&h=450",
    "light3":  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&h=450",
    "light4":  "https://images.unsplash.com/photo-1508094573783-5cf30b30e4d9?auto=format&fit=crop&w=800&h=450",

    # Sidewalk cluster
    "side1":   "https://images.unsplash.com/photo-1558981852-426c349a3b9e?auto=format&fit=crop&w=800&h=450",
    "side2":   "https://images.unsplash.com/photo-1473186505569-9c61870c11f9?auto=format&fit=crop&w=800&h=450",
    "side3":   "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=800&h=450",
    "side4":   "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&h=450",

    # Flooding / drainage cluster
    "flood1":  "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&h=450",
    "flood2":  "https://images.unsplash.com/photo-1559827291-72ebf439f15b?auto=format&fit=crop&w=800&h=450",
    "flood3":  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=800&h=450",

    # Green zone / park
    "green1":  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&h=450",
    "green2":  "https://images.unsplash.com/photo-1500534314209-a157d0e30ede?auto=format&fit=crop&w=800&h=450",
    "green3":  "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&h=450",

    # Park equipment
    "play1":   "https://images.unsplash.com/photo-1575783970733-1aaedde1db74?auto=format&fit=crop&w=800&h=450",
    "play2":   "https://images.unsplash.com/photo-1519331582073-283f174e3ed4?auto=format&fit=crop&w=800&h=450",

    # Fountain
    "fount1":  "https://images.unsplash.com/photo-1564502952-d05fa4da66e9?auto=format&fit=crop&w=800&h=450",
    "fount2":  "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?auto=format&fit=crop&w=800&h=450",

    # Road excavation
    "excav1":  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&h=450",
    "excav2":  "https://images.unsplash.com/photo-1531171074112-91f7d13f0562?auto=format&fit=crop&w=800&h=450",

    # Ice / slip
    "ice1":    "https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=800&h=450",
    "ice2":    "https://images.unsplash.com/photo-1548171915-f3bb1b23e3f0?auto=format&fit=crop&w=800&h=450",

    # Signage
    "sign1":   "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=800&h=450",

    # Cleanliness
    "clean1":  "https://images.unsplash.com/photo-1563197891098-3e3da5b4e26e?auto=format&fit=crop&w=800&h=450",

    # Facade
    "facade1": "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&h=450",
}


# ── Report data ───────────────────────────────────────────────────────────────
# (lat, lng, category, severity, title_az, desc_az, user, img_key, status, tags)

CLUSTERS = [

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER 1 — İnşaatçılar prospekti: Asfalt çuxuru (5 reports → 1 issue)
    # Showcases: largest cluster, high-severity road damage, IN_PROGRESS
    # ══════════════════════════════════════════════════════════════════════════
    (40.4093, 49.8671, Category.ROAD_SURFACE, Severity.HIGH,
     "Əsas yolda dərin çuxur yaranıb",
     "Koroğlu qovşağına yaxın hissədə böyük çuxur var. Yağışdan sonra su dolur, sürücülər onu görə bilmir.",
     "Anar Məmmədov", "road1", None,
     ["asfalt", "çuxur", "prospekt", "təcili"]),

    (40.4094, 49.8672, Category.ROAD_SURFACE, Severity.HIGH,
     "Çuxur genişlənib — çınqıl açılıb",
     "Çuxur son günlərdə daha da böyüyüb. Dünən bir minik maşının ön asqısı burada sındı.",
     "Leyla Həsənova", "road2", IssueStatus.ROUTED,
     ["asfalt", "zədə", "maşın"]),

    (40.4092, 49.8670, Category.ROAD_SURFACE, Severity.HIGH,
     "Gecə çuxura düşdüm — təkərim partladı",
     "Gecə vaxtı çuxuru görmədim. Sağ ön təkər tamamilə patladı. Bu yer işarələnib bağlanmalıdır.",
     "Rəşad Əliyev", "road3", IssueStatus.IN_PROGRESS,
     ["asfalt", "xəsarət", "gecə"]),

    (40.4093, 49.8670, Category.ROAD_SURFACE, Severity.HIGH,
     "Asfalt çuxuru böyüyür — sutkalıq izlədim",
     "Hər gün bu yerdən keçirəm. Çuxur 3 gündə iki dəfə böyüdü. Gündüz nəqliyyat sıxlığında çox təhlükəli görünür.",
     "Fərid Qasımov", "road4", None,
     ["asfalt", "izləmə", "nəqliyyat"]),

    (40.4094, 49.8671, Category.ROAD_SURFACE, Severity.HIGH,
     "Sürücülər çuxuru keçmək üçün həsr edilmiş zolaqa çıxır",
     "Çuxurdan yan keçmək üçün sürücülər tərs istiqamətə çıxır. Bu səhər 2 nəfərin diqqətsizliyini gördüm.",
     "Murad Babayev", "road5", IssueStatus.IN_PROGRESS,
     ["asfalt", "yol", "qayda", "təhlükə"]),

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER 2 — Gənclik metro: Zibil daşıb (5 reports → 1 issue)
    # Showcases: ROUTED cluster, anti-sanitary conditions escalation
    # ══════════════════════════════════════════════════════════════════════════
    (40.4040, 49.8720, Category.WASTE, Severity.MEDIUM,
     "Gənclik metrosu qarşısında konteynerlər dolu",
     "Metro girişi qarşısındakı 4 konteyner 5 gündür boşaldılmır. Yay istisinin təsiri ilə ağır qoxu yayılır.",
     "Fərid Qasımov", "waste1", None,
     ["zibil", "konteyner", "metro"]),

    (40.4041, 49.8721, Category.WASTE, Severity.MEDIUM,
     "Zibil konteynerin kənarına da atılıb",
     "Dolu konteynerin ətrafında məişət tullantıları yığılıb. Siçovul izi gördüm.",
     "Aysel Hüseynova", "waste2", IssueStatus.ROUTED,
     ["zibil", "siçovul", "sanitariya"]),

    (40.4039, 49.8719, Category.WASTE, Severity.HIGH,
     "Uşaq parkı zibilliyin yanındadır",
     "Zibil 1 həftədir yığışdırılmır. Konteynerin 10 metr yanında uşaq parkı var.",
     "Kamil Vəliyev", "waste3", None,
     ["zibil", "uşaq", "park"]),

    (40.4040, 49.8719, Category.WASTE, Severity.HIGH,
     "Vəziyyət daha da pisləşib — qoxu hər yerə yayılıb",
     "Bu gün konteynerlərdən birinin qapağı sınıb, tullantılar yola dağılıb.",
     "Nərmin İsgəndərova", "waste4", None,
     ["zibil", "dağıntı", "yol"]),

    (40.4041, 49.8720, Category.WASTE, Severity.HIGH,
     "Metro ziyarətçiləri qoxudan şikayət edir",
     "Gündə yüzlərlə insan bu yerdən keçir. Antisanitar şərait turistlər üçün xoşagəlməz mənzərədir.",
     "Leyla Həsənova", "waste5", IssueStatus.ROUTED,
     ["zibil", "metro", "turizm"]),

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER 3 — Mirzə Fətəli küçəsi: İşıqlandırma (4 reports → 1 issue, RESOLVED)
    # Showcases: fully resolved cluster — all steps green ✓
    # ══════════════════════════════════════════════════════════════════════════
    (40.4120, 49.8620, Category.LIGHTING, Severity.HIGH,
     "Mirzə Fətəli küçəsinin 3 dirəyi 2 həftədir sönüb",
     "Küçənin 200 metrlik hissəsindəki LED dirəylər işləmir. Gecə piyadalar üçün tamamilə qaranlıqdır.",
     "Kamil Vəliyev", "light1", None,
     ["işıq", "dirək", "qaranlıq"]),

    (40.4121, 49.8621, Category.LIGHTING, Severity.HIGH,
     "Qaranlıq küçədə velosiped-maşın toqquşması baş verdi",
     "Dünən gecə bir velosipedçi burada maşınla toqquşdu. İşıq olmadığı üçün heç biri digərini görə bilməyib.",
     "Murad Babayev", "light2", IssueStatus.RESOLVED,
     ["işıq", "qəza", "velosiped"]),

    (40.4120, 49.8619, Category.LIGHTING, Severity.MEDIUM,
     "Axşam saatlarında qadınlar bu yoldan keçmir",
     "Məhəllə sakinləri — xüsusən qadınlar — gecə vaxtı bu küçəni istifadə etmirlər. Sosial problem yaranıb.",
     "Aysel Hüseynova", "light3", IssueStatus.RESOLVED,
     ["işıq", "təhlükəsizlik", "qadın"]),

    (40.4121, 49.8620, Category.LIGHTING, Severity.MEDIUM,
     "Dirəklərin bərpasından sonra minnətdarlıq bildirirəm",
     "Sistem vasitəsilə bildiriş etmişdim. 48 saat içərisində briqada gəlib işıqları bərpa etdi. Çox sürətli!",
     "Rəşad Əliyev", "light4", IssueStatus.RESOLVED,
     ["işıq", "həll", "minnətdarlıq"]),

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER 4 — Atatürk prospekti: Səki dağılıb (4 reports → 1 issue)
    # Showcases: accessibility issues, escalating severity
    # ══════════════════════════════════════════════════════════════════════════
    (40.4150, 49.8580, Category.SIDEWALK, Severity.HIGH,
     "Atatürk prospektinin 150m səkisi tamamilə qırılıb",
     "Plitələrin böyük hissəsi qalxıb, arasından beton görünür. Yaşlı sakinlər və əlil arabalılar keçə bilmir.",
     "Rəşad Əliyev", "side1", None,
     ["səki", "plita", "əlil"]),

    (40.4151, 49.8581, Category.SIDEWALK, Severity.HIGH,
     "Qalxmış plitəyə ilişib yıxıldım — qolum sındı",
     "Bu səhər 11:30-da qaçarkən plitəyə ilişib yıxıldım. Qolum qırıldı, xəstəxanaya getdim.",
     "Nərmin İsgəndərova", "side2", IssueStatus.MANUAL_REVIEW,
     ["səki", "xəsarət", "qırıq"]),

    (40.4149, 49.8580, Category.SIDEWALK, Severity.MEDIUM,
     "Uşaqlar arabalı anaların keçməsi mümkün deyil",
     "Körpəli anaların arabaları daş-kəsəyin arasından keçə bilmir. Yoldan istifadə etmək məcburiyyəti var.",
     "Leyla Həsənova", "side3", IssueStatus.MANUAL_REVIEW,
     ["səki", "araba", "ana", "körpə"]),

    (40.4150, 49.8579, Category.SIDEWALK, Severity.HIGH,
     "Üst plitə yerindən oynadı — altdakı boşluq görünür",
     "Plitənin altı tamamilə boşdur. Üstündə dursan aşağı düşmə ehtimalı var. Bağlanmadan keçirilmir.",
     "Fərid Qasımov", "side4", None,
     ["səki", "boşluq", "təcili"]),

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER 5 — Gənclik prospekti: Subasma (3 reports → 1 issue, IN_PROGRESS)
    # ══════════════════════════════════════════════════════════════════════════
    (40.4110, 49.8560, Category.FLOODING, Severity.HIGH,
     "Gənclik prospektinin drenajı tıxanıb",
     "Yarpaq və tullantılarla dolu drenaj kanalı suyun axmasına mane olur. Hər yağışda 20-30sm su birikir.",
     "Fərid Qasımov", "flood1", None,
     ["drenaj", "su", "yağış"]),

    (40.4111, 49.8562, Category.FLOODING, Severity.HIGH,
     "Nəqliyyat keçə bilmir — subasma hər gün yenilənir",
     "Bu gün yenidən yol bağlandı. 40 dəqiqə orada qaldım. Sürücülər geri dönmək məcburiyyətində qaldı.",
     "Kamil Vəliyev", "flood2", IssueStatus.IN_PROGRESS,
     ["su", "nəqliyyat", "maneə"]),

    (40.4110, 49.8561, Category.FLOODING, Severity.HIGH,
     "Mağazaya su doluşdu — ziyan çəkdim",
     "Drenaj tıxandığı üçün yığılan su mağazama daxil oldu. Mallar korlandı. Birbaşa iqtisadi ziyan.",
     "Aysel Hüseynova", "flood3", IssueStatus.IN_PROGRESS,
     ["su", "mağaza", "ziyan"]),

    # ══════════════════════════════════════════════════════════════════════════
    # CLUSTER 6 — Nərimanov bağı: Yaşıllıq baxımsız (3 reports → 1 issue)
    # ══════════════════════════════════════════════════════════════════════════
    (40.4180, 49.8550, Category.GREEN_ZONE, Severity.LOW,
     "Nərimanov bağında otlar 1 metrdən hündürdür",
     "Park uzun müddətdir biçilməyib. Həşərat yuvaları əmələ gəlib, sakinlər parkdan istifadə edə bilmir.",
     "Anar Məmmədov", "green1", None,
     ["ot", "bağ", "həşərat"]),

    (40.4181, 49.8552, Category.GREEN_ZONE, Severity.MEDIUM,
     "Uzun otlar içərisindən ilan keçdiyini gördüm",
     "Günortadan sonra parkda oynayan uşaqların yanından ilan keçdi. Çox ciddi təhlükə var.",
     "Leyla Həsənova", "green2", IssueStatus.ROUTED,
     ["ilan", "uşaq", "xəta"]),

    (40.4180, 49.8551, Category.GREEN_ZONE, Severity.LOW,
     "Park əvvəllər çox gözəl idi — indi girə bilmirik",
     "Keçən il bu park mükəmməl idi. İndi otlar o qədər böyüyüb ki içəriyə girə bilmirsən.",
     "Murad Babayev", "green3", None,
     ["ot", "park", "baxımsız"]),

    # ══════════════════════════════════════════════════════════════════════════
    # STANDALONE REPORTS — unique location/category
    # ══════════════════════════════════════════════════════════════════════════
    (40.4140, 49.8730, Category.PARK_EQUIPMENT, Severity.HIGH,
     "Parkdakı yelləncək qırıldı — 7 yaşlı uşaq yıxıldı",
     "Yelləncəyin zənciri sındı, uşaq düşdü. Dizini cırıb ağladı. Dərhal bağlanmalıdır.",
     "Nərmin İsgəndərova", "play1", IssueStatus.MANUAL_REVIEW,
     ["yelləncək", "uşaq", "yaralanma"]),

    (40.4070, 49.8700, Category.FOUNTAIN, Severity.MEDIUM,
     "Mərkəzi park fontanı işləmir",
     "Fontan su pompası sıradan çıxıb. Balıqların çürüdüyü görünür, pis qoxu var.",
     "Fərid Qasımov", "fount1", None,
     ["fontan", "pompa", "qoxu"]),

    (40.4200, 49.8600, Category.ROAD_EXCAVATION, Severity.MEDIUM,
     "Cavad Xan küçəsindəki qazıntı 3 həftədir açıqdır",
     "Boru xətti üçün qazılmış 80 metrlik xəndək bağlanmayıb. Gecə keçmək mümkün deyil.",
     "Murad Babayev", "excav1", None,
     ["qazıntı", "xəndək", "yol"]),

    (40.4060, 49.8640, Category.ICE, Severity.HIGH,
     "Nərimanov prospektinin səkisi donub — iki nəfər yıxılıb",
     "Su borusu sızmasından yaranan su donub. Bu gün iki nəfərin yıxıldığını gördüm.",
     "Rəşad Əliyev", "ice1", IssueStatus.IN_PROGRESS,
     ["buz", "yıxılma", "boru"]),

    (40.4020, 49.8780, Category.SIGNAGE, Severity.LOW,
     "45 nömrəli məktəbin girişini reklam lövhəsi bağlayıb",
     "İcazəsiz böyük reklam lövhəsi məktəb girişini bağlayır. İşıq girişini azaldır.",
     "Aysel Hüseynova", "sign1", None,
     ["reklam", "məktəb", "qanunsuz"]),

    (40.4160, 49.8680, Category.CLEANLINESS, Severity.MEDIUM,
     "Park küçəsi bir həftədir süpürülməyib",
     "Yarpaq, plastik, çirkab küçəni örtüb. Yağış olsa su tıxanacaq.",
     "Leyla Həsənova", "clean1", None,
     ["küçə", "yarpaq", "tullantı"]),

    (40.4100, 49.8500, Category.FACADE, Severity.LOW,
     "Binanın fasadından material qopub piyada keçidinə düşüb",
     "Atatürk parkı yaxınlığındakı 5 mərtəbəli binanın fasadından böyük parça qopub.",
     "Anar Məmmədov", "facade1", None,
     ["fasad", "qopma", "piyada"]),
]


# ── Insert with clustering ────────────────────────────────────────────────────
total_reports = 0
for entry in CLUSTERS:
    lat, lng, cat, sev, title, desc, uname, img_key, status_override, tags = entry
    user_id = users[uname]
    deadline = compute_deadline(cat, sev)
    org = suggest_org(cat)

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
        issue.report_count += 1
        if status_override and status_override != IssueStatus.MANUAL_REVIEW:
            issue.status = status_override
        session.add(issue); session.flush()
    else:
        issue = Issue(
            category=cat, severity=sev, title_az=title, description_az=desc,
            lat=lat, lng=lng, status=status, deadline=deadline,
            org_key=org.key, tags=tags,
        )
        session.add(issue); session.flush()

    report = Report(
        user_id=user_id, issue_id=issue.id,
        image_url=IMGS.get(img_key, f"https://picsum.photos/seed/{img_key}/800/450"),
        user_text=desc, lat=lat, lng=lng,
        ai_is_relevant=True, ai_category=cat, ai_severity=sev,
        ai_confidence=0.89, ai_raw={"seed": True},
    )
    session.add(report); session.flush()

    if not issue.root_report_id:
        issue.root_report_id = report.id
        session.add(issue)

    issue.priority = priority_score(issue.severity, issue.report_count, issue.created_at or _utcnow())
    issue.updated_at = _utcnow()
    session.add(issue)
    total_reports += 1

session.commit()

# ── Coin awards ───────────────────────────────────────────────────────────────
coin_map = {
    "Anar Məmmədov": 1240, "Leyla Həsənova": 870, "Rəşad Əliyev": 650,
    "Fərid Qasımov": 520,  "Kamil Vəliyev": 430, "Aysel Hüseynova": 310,
    "Murad Babayev": 195,  "Nərmin İsgəndərova": 140,
}
for u in session.exec(select(User)).all():
    u.coins = coin_map.get(u.display_name, 100)
    session.add(u)
session.commit()

# ── Summary ───────────────────────────────────────────────────────────────────
issues = session.exec(select(Issue)).all()
clustered = sum(1 for i in issues if i.report_count > 1)
rcount = len(session.exec(select(Report)).all())
print(f"\nSeeded {rcount} reports across {len(issues)} issues.")
print(f"  Clustered issues (2+ reports): {clustered}")
by_status: dict[str, int] = {}
for i in issues:
    by_status[i.status.value] = by_status.get(i.status.value, 0) + 1
print("Status breakdown:")
for k, v in sorted(by_status.items()):
    print(f"  {k}: {v}")
print("\nDone. Run: OPENWAVE_MOCK=1 uvicorn main:app --reload --port 8000")
