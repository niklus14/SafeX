"""
seed_mock.py — Simple script to load mock data into the database
Run: cd back && python seed_mock.py
"""
from models import init_db, engine, Issue, Organization
from sqlmodel import Session, select
from enums import Category, IssueStatus, Severity
from datetime import datetime

# Initialize database
init_db()
session = Session(engine)

# Add organizations if they don't exist
orgs = [
    ('azersu', 'Azərsu', 'city_utility', 'info@azersu.az'),
    ('azeriqaz', 'Azəriqaz', 'city_utility', 'info@azeriqaz.az'),
    ('baku_electric', 'Bakı Elektrik Şəbəkəsi', 'city_utility', 'info@bakuenergy.az'),
    ('kennan', 'Kənan-A', 'district', 'info@kenan.az'),
    ('aztelecom', 'Azərtelekom', 'city_utility', 'info@aztelecom.az'),
    ('parks', 'Yaşıllıq və Parklar', 'district', 'parks@baku.gov.az'),
    ('cleaning', 'Təmizlik İdarəsi', 'district', 'cleaning@baku.gov.az'),
    ('road', 'Nəqliyyat və Yollar', 'district', 'roads@baku.gov.az'),
    ('construction', 'Tikinti İdarəsi', 'district', 'construction@baku.gov.az'),
    ('emergency', 'Fövqəladə Hallar', 'city_service', 'emergency@az.gov.az'),
]

for key, name, scope, contact in orgs:
    existing = session.get(Organization, key)
    if not existing:
        session.add(Organization(key=key, name_az=name, scope=scope, contact_hint=contact))

session.commit()
print(f"Organizations seeded: {len(orgs)}")

# Add sample issues
sample_issues = [
    (40.4093, 49.8671, 'Asfalt örtüyünün zədələnməsi', 'Hüseyn Cavid prospektində asfalt örtüyündə çuxurlar var', Category.ROAD_SURFACE, IssueStatus.IN_PROGRESS, Severity.HIGH, 65.5, 'road', 12),
    (40.4100, 49.8680, 'Yol səthinin deformasiyası', 'Nizami küçəsində asfalt örtüyü zədələnib', Category.ROAD_SURFACE, IssueStatus.AI_REVIEW, Severity.MEDIUM, 45.2, 'road', 8),
    (40.4130, 49.8710, 'İşıq dirəyinin fəaliyyətsizliyi', 'Füzuli küçəsində küçə lampası işləmir', Category.LIGHTING, IssueStatus.IN_PROGRESS, Severity.HIGH, 60.5, 'baku_electric', 18),
    (40.4112, 49.8692, 'Su axınının olması', 'Rəşid Behbudov küçəsində yağışdan sonra su toplanır', Category.FLOODING, IssueStatus.IN_PROGRESS, Severity.HIGH, 68.7, 'azersu', 25),
    (40.4125, 49.8715, 'Uşaq meydançasının zədələnməsi', 'Nərimanov parkında uşaq qurğuları sınıb', Category.PARK_EQUIPMENT, IssueStatus.IN_PROGRESS, Severity.HIGH, 62.3, 'parks', 16),
    (40.4105, 49.8685, 'Səkinin zədələnməsi', 'Azadlıq prospektində səki daşları sınıb', Category.SIDEWALK, IssueStatus.IN_PROGRESS, Severity.MEDIUM, 48.3, 'road', 11),
    (40.4128, 49.8708, 'Çirkablıq yığımı', 'Büllur prospektində zibil yığılıb', Category.CLEANLINESS, IssueStatus.IN_PROGRESS, Severity.MEDIUM, 43.5, 'cleaning', 15),
    (40.4092, 49.8672, 'Kanalizasiya problemi', 'Hüseyn Cavid prospektində su axını var', Category.FLOODING, IssueStatus.AI_REVIEW, Severity.HIGH, 55.3, 'azersu', 14),
    (40.4094, 49.8674, 'Qurğunun təhlükəli vəziyyəti', 'Füzuli parkında swing əyilib', Category.PARK_EQUIPMENT, IssueStatus.AI_REVIEW, Severity.HIGH, 58.0, 'parks', 12),
    (40.4088, 49.8668, 'Buzlaşma problemi', 'Nizami küçəsində buzla örtülü sahə var', Category.ICE, IssueStatus.AI_REVIEW, Severity.MEDIUM, 35.5, 'cleaning', 7),
]

for lat, lng, title, desc, cat, status, sev, priority, org_key, report_count in sample_issues:
    issue = Issue(
        lat=lat,
        lng=lng,
        title_az=title,
        description_az=desc,
        category=cat,
        status=status,
        severity=sev,
        priority=priority,
        org_key=org_key,
        report_count=report_count,
        deadline=datetime(2024, 6, 15)
    )
    session.add(issue)

session.commit()
print(f"Issues seeded: {len(sample_issues)}")

# Verify
org_count = len(session.exec(select(Organization)).all())
issue_count = len(session.exec(select(Issue)).all())
print(f"\nTotal in database:")
print(f"  Organizations: {org_count}")
print(f"  Issues: {issue_count}")

session.close()
print("\nMock data loaded successfully!")
