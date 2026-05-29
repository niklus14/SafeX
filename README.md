# Openwave — Nərimanov Issue Reporting Platform (foundation)

A geolocation issue-reporting platform for Nərimanov rayonu. Two surfaces over
**one** shared data model:

- **Admin dashboard** — operators review reports on a map (heatmap ⇄ thread views
  of the same data), confirm/override the AI's classification, set deadlines,
  route to the responsible body, reject with reason, add notes, import/export.
- **Citizen mobile app** — snap a photo → AI gates + structures it → it becomes a
  tracked issue → reporter watches the live status stepper. Repeated photos of the
  same problem cluster into one X-style thread. Top contributors earn coins.

This folder is the **verified spine + the hard AI/logic core**. It runs and is
smoke-tested end to end (`OPENWAVE_MOCK=1`, no API key needed).

## Documentation (`docs/`)
- [`docs/SETUP.md`](docs/SETUP.md) — get running in 5 minutes (env, deps, smoke test)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system overview, lifecycle + data-flow diagrams
- [`docs/API.md`](docs/API.md) — complete endpoint spec (build both frontends against this)
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — entities, enums, threading rule, SLA + routing tables
- [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) — 48h plan, parallel workstreams, rubric map, Q&A prep

---

## Why each piece earns rubric points

| Rubric criterion (bal) | Where it lives |
|---|---|
| **Texniki İcra / working prototype (30)** | Real, tested loop: `ai_intake` → `taxonomy` (deadline+routing) → `models` (persist) → `clustering` (thread). All green in the smoke test. |
| **Problemin Həlli & Aktuallıq (20)** | Categories mirror the organizers' own validated list (`enums.Category`); routes to **real** Nərimanov/Baku bodies (`taxonomy.ORGS`). |
| **İnnovasiya & Kreativlik (15)** | One zero-shot **Grok vision call** uses photo + the citizen's typed text to do relevance-gate + category + severity + AZ summary + dedup tags (`ai_intake.py`). No dataset, no training. |
| **UX/UI (15)** | Same status enum + AZ labels drive both the operator pipeline and the citizen stepper (`enums.CITIZEN_PIPELINE`) — the two sides can't drift. |
| **Tətbiqolunma / Feasibility (10)** | Deadlines are a **transparent table** (`taxonomy.SLA_DAYS`), routing is a **fixed map** — a state body can read both out loud and integrate them. Import/export stubs included. |
| **Təqdimat (10)** | Heatmap colours + priority are deterministic and explainable (`clustering.priority_score`), so "why is this red?" has a real answer in Q&A. |

---

## File map

```
backend/
  enums.py        # THE SHARED CONTRACT — IssueStatus, Severity, Category (+ AZ labels)
  taxonomy.py     # routing + deadline brain: category×severity → SLA days, category → real org
  ai_intake.py    # the differentiator: one Grok vision call (photo + citizen text) → validated JSON
  clustering.py   # X-style threading (75 m + same category + open) + priority + heatmap colour
  models.py       # SQLModel spine: User · Report · Issue(=thread) · Organization (+ init_db)
  requirements.txt
data/
  organizations.csv  # the real responsible bodies (reference)
  sample_import.csv  # 8 historical Nərimanov issues for the import stub
```

### The two design decisions that survive Q&A
1. **The AI never predicts a date.** It classifies; the deadline is
   `report_time + SLA_DAYS[category][severity]`. Ask any juror "how do you get the
   deadline?" → it's a policy table, not a guess.
2. **The AI never decides.** Every intake lands in `MANUAL_REVIEW`; the operator
   approves or overrides. The model is a fast first pass, not the judge.

---

## Run it

```bash
cd backend
pip install -r requirements.txt

# build the demo DB + seed the 9 real organizations
python -c "from models import init_db; init_db()"

# develop with NO api key (deterministic fake intake) — great for the frontend dev:
export OPENWAVE_MOCK=1
# real intake instead:  export XAI_API_KEY=xai-...   (and unset OPENWAVE_MOCK)
#   model slug lives in ai_intake.VISION_MODEL ("grok-4.3"); confirm at docs.x.ai/developers/models
```

The mock lets the citizen-app and dashboard devs build the whole UI before anyone
wires a real key.

---

## API contract (build the frontends against this — routes land next)

The spine above is framework-agnostic; the FastAPI layer is the next build unit.
Both apps should code against these shapes now:

**Citizen — submit a report**
```
POST /reports            multipart: image, description, lat, lng, user_id
→ 200 { issue_id, status, joined_thread: bool, is_relevant: true,
        category, severity, title_az, deadline }
→ 200 { is_relevant: false, rejection_reason_az, credibility }   # photo rejected
```
The citizen's `description` is stored on the Report (`user_text`) and passed into
the Grok call as context; the issue's `description_az` is seeded from it.

**Citizen — watch progress / see a thread**
```
GET  /issues/{id}        → issue + ordered reports (root first) + report_count
GET  /me/{user_id}       → { credibility, coins, reports: [...] }
```

**Admin — queue, map, act**
```
GET  /admin/issues?status=&category=&sort=priority   → list for table + thread view
GET  /admin/map          → [{ id, lat, lng, category, intensity, color, report_count }]
POST /admin/issues/{id}/approve   { severity?, category?, org_key?, deadline?, notes? }
POST /admin/issues/{id}/reject    { rejection_reason_az }
POST /admin/issues/{id}/status    { status }     # routed → in_progress → resolved
POST /admin/import       multipart: file (csv/txt)   # uses data/sample_import.csv shape
GET  /admin/export.pdf                                # activity account (real)
```

Status values are exactly `enums.IssueStatus` values. Categories are exactly
`enums.Category` values. Nothing else is valid — that's what keeps the two
surfaces in sync.

---

## Next build units (in order)
1. **`main.py` (FastAPI)** — wire the routes above onto the spine: upload →
   `analyze_image` → relevance branch (reject + ding credibility, or
   `compute_deadline`+`suggest_org`+`find_thread`+persist) → admin actions →
   PDF export → CSV import.
2. **Admin dashboard (React)** — the demo centerpiece: map with heatmap ⇄ thread
   toggle, priority-sorted queue, the approve/override/route panel.
3. **Citizen app** — camera → upload → status stepper → thread view → coins.

Reward *marketplace* stays mocked (coin balance + redeemables screen); coins
themselves are real (awarded on accepted/resolved reports).
