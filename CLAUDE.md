# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Openwave** — a geolocation issue-reporting platform for Nərimanov rayonu, Baku. Two surfaces over one shared data model:
- **Admin dashboard** (React, not yet built) — operator queue, map heatmap, approve/override AI output, route to orgs
- **Citizen mobile app** (`mobile-ui/`) — photo → AI gate → tracked issue → status stepper → coins

The backend spine is complete and smoke-tested. `main.py` (FastAPI wiring) is the **next build unit** and does not exist yet.

---

## Commands

### Backend (Python)

```bash
cd back
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Seed DB with 9 real organizations
python -c "from models import init_db; init_db()"

# Run API (once main.py exists)
uvicorn main:app --reload --port 8000

# Smoke test (no API key needed)
OPENWAVE_MOCK=1 python -c "
from ai_intake import analyze_image
from taxonomy import compute_deadline, suggest_org
r = analyze_image(b'demo'*900, 'image/jpeg', user_text='Səkidə buz var')
print(r.category.value, r.severity.value, '->', suggest_org(r.category).name_az,
      '/ deadline', compute_deadline(r.category, r.severity).date())
"
```

### Mobile UI (React/TypeScript)

```bash
cd mobile-ui
npm install
npm run dev        # dev server on port 3000
npm run build      # production build
npm run lint       # TypeScript type check (tsc --noEmit)
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `XAI_API_KEY` | for real intake | xAI/Grok API key |
| `OPENWAVE_MOCK` | no | set to `1` to fake AI intake (no key needed) |

---

## Architecture

```
mobile-ui/ (React 19 + Vite + TailwindCSS v4)
back/
  enums.py      ← THE SHARED CONTRACT (IssueStatus, Severity, Category + AZ labels)
  taxonomy.py   ← SLA deadline table + category→org routing
  ai_intake.py  ← single Grok vision call: relevance gate + category + severity + AZ text
  clustering.py ← X-style thread joining (75m + same category + open) + priority + heatmap colour
  models.py     ← SQLModel entities: User · Report · Issue(=thread) · Organization + init_db()
  main.py       ← (NOT YET BUILT) FastAPI routes wiring the above
data/
  organizations.csv    ← 9 real Nərimanov responsible bodies
  sample_import.csv    ← 8 historical issues for the import stub
docs/           ← full spec: ARCHITECTURE, API, DATA_MODEL, BUILD_PLAN, SETUP
```

### Key invariants

- **`enums.py` is the only source of truth** for status, severity, and category values. Never use raw strings for these in any surface — always use the enum `.value`. The API rejects anything not in `enums.py` with 422.

- **The AI classifies; it never picks a date.** Deadlines come from `taxonomy.SLA_DAYS[category][severity]` — a policy table, not a model output. This is intentional and load-bearing for the demo Q&A.

- **The AI proposes; the operator decides.** Every intake lands in `manual_review`. Nothing is auto-routed.

- **Threading rule:** a new report joins an existing open `Issue` (thread) if it is within **75 metres**, same category, and the issue is not terminal. Otherwise a new `Issue` is created as the thread root.

### Intake data flow (golden path)

`POST /reports` → `ai_intake.analyze_image()` (Grok or mock) → relevance branch:
- **Irrelevant**: reject report, decrement citizen credibility
- **Relevant**: `taxonomy.compute_deadline()` + `taxonomy.suggest_org()` + `clustering.find_thread()` → persist `Report` + `Issue` with status `manual_review`

### Mobile UI notes

`mobile-ui/` is a **demo prototype** — all state is local React state in `App.tsx`. It does not call the real API yet. Screens are rendered conditionally in a single large `App.tsx` file controlled by the `AppScreen` enum (`src/types.ts`). Shared seed data lives in `src/data.ts`.

The UI language is **Azerbaijani**. Display strings come from `enums.py`'s `label_az` properties on the real backend; in the prototype they are hardcoded in Azerbaijani.

### API base URL

`http://localhost:8000` — full endpoint spec is in `docs/API.md`. Build both frontends against that spec; with `OPENWAVE_MOCK=1` the AI intake is faked so no key is needed during frontend development.
