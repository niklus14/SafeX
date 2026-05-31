# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**myRegion** (internal codename: Openwave) — a geolocation issue-reporting platform for Nərimanov rayonu, Baku. Three surfaces over one shared data model:
- **Admin dashboard** (`dashboard/front/dashboard.html`) — static HTML; operator queue, map heatmap (Leaflet + Chart.js), approve/override AI output, route to orgs
- **Citizen mobile app** (`mobile/`) — photo → AI gate → tracked issue → status stepper → points (xal)
- **Hardware** (`Hardware/`) — ESP32 firmware + FastAPI sensor endpoint + PostgreSQL schema + AI/risk modules

The backend (`back/main.py`) is fully built and running.

---

## Commands

### Backend (Python)

```bash
cd back
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Seed DB (organizations + sample data)
OPENWAVE_MOCK=1 python seed.py

# Run API
OPENWAVE_MOCK=1 uvicorn main:app --reload --port 8000   # mock AI, no key needed
XAI_API_KEY=xai-... uvicorn main:app --reload --port 8000  # real Grok intake

# Smoke test (no API key needed)
OPENWAVE_MOCK=1 python -c "
from ai_intake import analyze_image
from taxonomy import compute_deadline, suggest_org
r = analyze_image(b'demo'*900, 'image/jpeg', user_text='Səkidə buz var')
print(r.category.value, r.severity.value, '->', suggest_org(r.category).name_az,
      '/ deadline', compute_deadline(r.category, r.severity).date())
"
```

### Mobile app (React/TypeScript) — active

```bash
cd mobile
npm install
npm run dev        # dev server on port 3001
npm run build      # production build
npm run lint       # TypeScript type check (tsc --noEmit)
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `XAI_API_KEY` | for real intake | xAI/Grok API key |
| `OPENWAVE_MOCK` | no | set to `1` to fake AI intake (no key needed) |
| `VITE_API_URL` | no | mobile API base URL (defaults to `http://localhost:8000`) |

---

## Architecture

```
mobile/                      ← ACTIVE citizen app (React 19 + Vite + TailwindCSS v4 + Motion)
  src/
    App.tsx                  ← shell (ShellHeader, BottomNav, screen router)
    store.tsx                ← useReducer + context (AppState, all dispatches)
    api.ts                   ← typed fetch client → localhost:8000
    types.ts                 ← Screen enum + shared types
    data.ts                  ← seed data for local state
    screens/                 ← one file per screen
mobile-ui/                   ← older prototype (port 3000), superseded by mobile/
dashboard/front/
  dashboard.html             ← admin panel (static HTML, Leaflet heatmap, Chart.js KPIs)
back/
  main.py                    ← FastAPI app (638 lines), all routes wired
  enums.py                   ← THE SHARED CONTRACT (IssueStatus, Severity, Category + AZ labels)
  taxonomy.py                ← SLA deadline table + category→org routing
  ai_intake.py               ← single Grok vision call: relevance gate + category + severity + AZ text
  clustering.py              ← X-style thread joining (75m + same category + open) + priority + heatmap colour
  models.py                  ← SQLModel entities: User · Report · Issue(=thread) · Organization + init_db()
  rewards.py                 ← coin/xal constants and award helpers (ONLY place these values live)
  pdf_report.py              ← A4 activity report via reportlab
  seed.py                    ← comprehensive seed with clustered data + images
  organizations.csv          ← 9 real Nərimanov responsible bodies
  sample_import.csv          ← historical issues for the import stub
Hardware/
  esp.cpp                    ← ESP32 firmware
  FastAPI.py / UploadEndpoint.py ← sensor data endpoints
  AIPart.py / RiskCalculate.py   ← hardware-side AI + risk scoring
  PostgreSQL.sql             ← hardware DB schema
docs/                        ← full spec: ARCHITECTURE, API, DATA_MODEL, BUILD_PLAN, SETUP
```

### API routes (main.py)

| Method | Path | Purpose |
|---|---|---|
| POST | `/users` | Register citizen (demo auth) |
| POST | `/reports` | Full intake + clustering pipeline |
| GET | `/issues/{issue_id}` | Issue detail + thread + citizen stepper |
| GET | `/me/{user_id}` | Citizen profile: xal, credibility, issues |
| GET | `/rewards` | Static rewards catalogue |
| GET | `/admin/issues` | Paginated queue (filter/sort) |
| GET | `/admin/map` | Heatmap dots layer |
| POST | `/admin/issues/{id}/approve` | Operator approve |
| POST | `/admin/issues/{id}/reject` | Operator reject |
| POST | `/admin/issues/{id}/status` | Status transition |
| GET | `/admin/orgs` | Responsible bodies list |
| GET | `/admin/stats` | Dashboard KPI cards |
| POST | `/admin/import` | CSV bulk import |
| GET | `/admin/export.pdf` | Activity report PDF |

### Key invariants

- **`enums.py` is the only source of truth** for status, severity, and category values. Never use raw strings — always use the enum `.value`. The API rejects anything not in `enums.py` with 422.

- **The AI classifies; it never picks a date.** Deadlines come from `taxonomy.SLA_DAYS[category][severity]` — a policy table, not a model output.

- **The AI proposes; the operator decides.** Every intake lands in `manual_review`. Nothing is auto-routed.

- **Threading rule:** a new report joins an existing open `Issue` if it is within **75 metres**, same category, and the issue is not terminal. Otherwise a new `Issue` is created as the thread root.

- **Rewards live in `rewards.py` only.** `COINS_NEW_REPORT`, `COINS_CLUSTERED`, `COINS_RESOLVED`, `CREDIBILITY_DING` are constants there. Never hardcode these values in route handlers.

### Intake data flow (golden path)

`POST /reports` → `ai_intake.analyze_image()` (Grok or mock) → relevance branch:
- **Irrelevant**: reject report, decrement citizen credibility
- **Relevant**: `taxonomy.compute_deadline()` + `taxonomy.suggest_org()` + `clustering.find_thread()` → persist `Report` + `Issue` with status `manual_review`

### Mobile app notes

`mobile/` has real API integration via `api.ts` (pointing to `VITE_API_URL`). State is managed with `useReducer` + React context in `store.tsx`. Each screen is a separate file under `src/screens/`.

The UI language is **Azerbaijani**. The currency unit is **Xal** (points) — not "Coin". Do not use "Coin" in any display string.

#### UI/UX design philosophy

**Minimal text, maximum intuition.** Every piece of text must earn its place. If colour, icon, layout, or interaction pattern can carry the meaning — remove the text. When in doubt, cut it.

Concrete rules derived from how the owner designs:

- **Progressive disclosure over upfront explanation.** Don't explain how something works on the default view. Put it behind a tap — an (i) icon, a bottom sheet, an expand action. The rewards earn-table is hidden until the user taps (i); the leaderboard award notice was removed from the default view entirely.
- **Replace labels with live data.** "Bu ay top 20 vətəndaş xallarına görə sıralanır" became nothing — the badge slot was repurposed to show "Sizin yeriniz: #N", which is contextual and immediately useful.
- **No disclaimers on screen.** Notices like "Coin pul deyil / Bu göstərici..." belong in onboarding, not repeated on every visit. Remove them.
- **One screen, no scroll by default.** A screen's default state should fit within the visible area. Use `h-full flex-col` layouts and show only the essential slice of a list (top 3, not top 20). If more detail exists, let the user pull it — don't push it.
- **Remove buttons that add complexity without clear value.** "Hamısını gör" was cut: if the full list isn't needed for the task, don't offer it.
- **Shorten every label to the minimum that preserves meaning.** "Liderlik cədvəli / Bu ay top 20..." → "Aylıq liderlik cədvəli". One line, one concept.
- **Use contextual cards instead of generic rows.** The user's own rank card (with "siz" pill + brand colour + `···` separator) conveys position in context without any explanatory text.

#### Phone frame + overlay pattern

On desktop, the app renders inside a 390×844 px phone frame: `#root` in `index.css` has `position: relative; overflow: hidden; border-radius: 44px`. This clips the content to the frame boundary.

**`position: fixed` escapes the frame** and covers the full browser viewport — do not use it for overlays, bottom sheets, or modals.

**Correct pattern:** use `createPortal(content, document.getElementById('root')!)` with `position: absolute` so the overlay is clipped by `#root`'s `overflow: hidden`. See `RewardsScreen.tsx` (bottom sheet) and `App.tsx` (`<Toast />`) for reference.

### API base URL

`http://localhost:8000` — full endpoint spec is in `docs/API.md`. With `OPENWAVE_MOCK=1` the AI intake is faked so no key is needed during frontend development.
