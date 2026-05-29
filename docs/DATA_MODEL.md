# Data Model

Single source of truth for entities, enums, and the rules that turn an AI
classification into a routed, deadlined, threaded issue. Code lives in
`backend/enums.py`, `backend/models.py`, `backend/taxonomy.py`,
`backend/clustering.py`.

## Entities

```
User 1───* Report *───1 Issue *───1 Organization
```

### User
| field | type | notes |
|---|---|---|
| id | int PK | |
| display_name | str | |
| phone | str? | |
| credibility | int | starts 100; irrelevant submissions decrement it |
| coins | int | earned on accepted/resolved contributions |
| created_at | datetime | |

### Report  — one citizen submission (evidence)
| field | type | notes |
|---|---|---|
| id | int PK | |
| user_id | int FK→User | |
| issue_id | int FK→Issue | the thread it belongs to |
| image_url | str | stored object/path |
| **user_text** | str | **citizen's own typed description** |
| lat, lng | float | where the photo was taken |
| ai_is_relevant | bool | snapshot of this photo's intake |
| ai_category | Category? | snapshot (audit; never overwritten) |
| ai_severity | Severity? | snapshot |
| ai_confidence | float | snapshot |
| ai_raw | json | full model JSON (audit trail) |
| created_at | datetime | |

### Issue  — the thread + official lifecycle (one per real-world problem)
| field | type | notes |
|---|---|---|
| id | int PK | |
| category | Category | AI-proposed, operator-confirmed |
| severity | Severity | AI-proposed, operator-confirmed |
| title_az, description_az | str | AI-generated, operator-editable |
| lat, lng | float | from the root report |
| status | IssueStatus | the lifecycle |
| rejection_reason_az | str? | set when `rejected` |
| deadline | datetime? | from `compute_deadline` |
| operator_notes | str? | |
| org_key | str FK→Organization | routed body |
| root_report_id | int? | the "main" post (X-style) |
| report_count | int | distinct citizen reports (reach) |
| ai_confidence | float | confidence of the root intake |
| tags | json[str] | dedup keywords |
| priority | float | derived; sort key for queue + heatmap |
| created_at, updated_at | datetime | |

### Organization  — responsible bodies (seeded by `init_db()`)
| field | type | notes |
|---|---|---|
| key | str PK | e.g. `azersu` |
| name_az | str | |
| scope | str | `district` \| `city_utility` \| `city_service` |
| contact_hint | str | mock routing target for the demo |

## Enums (the shared contract)

**IssueStatus** — `ai_review` · `manual_review` · `routed` · `in_progress` ·
`resolved` · `rejected`. AZ labels: Süni intellekt yoxlaması · Operator yoxlaması ·
Quruma yönləndirildi · İcradadır · Həll edildi · İmtina edildi.
`resolved`/`rejected` are terminal. `CITIZEN_PIPELINE` = the 5 forward steps shown
in the stepper (rejected rendered separately).

**Severity** — `low`(w1) · `medium`(w2) · `high`(w3). AZ: Aşağı · Orta · Yüksək.

**Category** (mirrors the organizers' validated list) — `facade`, `green_zone`,
`flooding`, `ice`, `cleanliness`, `waste`, `road_excavation`, `road_surface`,
`signage`, `storefront`, `park_equipment`, `fountain`, `sidewalk`,
`construction_fence`, `lighting`, plus `other` (AI fallback → always manual review).

## Threading rule (`clustering.find_thread`)
A new report **joins** an existing thread iff:
`distance ≤ 75 m`  **AND**  `same category`  **AND**  `thread not terminal`.
Otherwise it opens a new thread; its report becomes `root_report_id`. Among
qualifying threads, the **nearest** wins. `report_count` increments on join and
feeds both priority and heatmap intensity — so a hotspot = many people affected,
not just many dots.

## Priority (`clustering.priority_score`)
`severity_weight×10  +  log2(report_count+1)×8  +  min(age_days,14)×1.5`
Higher = more urgent. Drives queue sort order and heat colour. Heat buckets:
`≥0.75 #b3001b` · `≥0.50 #e23b2e` · `≥0.25 #f0833a` · else `#f2c14e`.

## SLA matrix (`taxonomy.SLA_DAYS`) — days to resolve, by category × severity
deadline = report_time + days below. (Excerpt; full table in `taxonomy.py`.)

| category | low | medium | high |
|---|---|---|---|
| flooding | 3 | 1 | 1 |
| ice | 2 | 1 | 1 |
| waste | 4 | 2 | 1 |
| cleanliness | 5 | 2 | 1 |
| park_equipment | 14 | 7 | 2 |
| lighting | 10 | 5 | 2 |
| green_zone | 14 | 7 | 3 |
| road_excavation | 14 | 7 | 3 |
| sidewalk | 30 | 14 | 5 |
| road_surface | 30 | 14 | 7 |
| facade | 45 | 21 | 10 |

## Routing map (`taxonomy.CATEGORY_TO_ORG`) — smart default, operator can override
| category | default org |
|---|---|
| flooding, road_excavation | `azersu` (“Azərsu” ASC) |
| waste, cleanliness | `temiz_seher` (“Təmiz Şəhər” ASC) |
| green_zone | `yasilliq` (Bakı Yaşıllaşdırma T.B.) |
| lighting | `bakiisiq` (“Bakıişıq” MMC) |
| facade | `mktb` (Nərimanov MKTB) |
| ice, road_surface, sidewalk, park_equipment, fountain | `abadliq` (RİH Abadlıq şöbəsi) |
| signage, storefront, construction_fence | `tikinti` (RİH Tikinti şöbəsi) |

`azerisiq` (“Azərişıq” ASC) and `azeriqaz` (“Azəriqaz” İB) are seeded for operator
reassignment (e.g. a gas-works excavation → reassign from `azersu` to `azeriqaz`).

## Rewards (coins) — marketplace mocked, coins real
Award on outcomes: report **accepted** (+10), report that **clusters** into a real
issue (+5), issue you reported **resolved** (+20). Redeem against the `/rewards`
catalog (UI only; no merchant integration for the demo).
