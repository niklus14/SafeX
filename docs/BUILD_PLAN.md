# Build Plan (48h)

Scope discipline wins this hackathon: a tight, deployed, demoable loop beats a
half-built everything. Build the **golden path** first; everything else is polish.

## Golden path (the one thing that must work on stage)
Citizen photographs a broken fountain + types a note → Grok structures it → it
appears on the admin map and queue with a suggested org + deadline → operator
approves and routes it → a second citizen photographs the same fountain → it
**clusters into the same thread** (`+1 reported`) → operator marks resolved →
citizen sees `Həll edildi` and earns coins → operator exports a PDF activity report.

If only that works, you score well on Problem (20), Texniki İcra (30), UX (15),
and have a clean 5-minute demo (10).

## Workstreams (assign among yourselves)
- **A — Backend/API**: `main.py`, wire all routes from [API.md](API.md) onto the
  verified spine; SQLite; import/export.
- **B — Admin dashboard**: map (heatmap ⇄ thread toggle), priority queue,
  approve/override/route panel, reject, notes, stats cards.
- **C — Citizen app**: camera + description + GPS submit, status stepper,
  X-style thread view, coins/rewards screen.
- **D — AI + data**: tune the Grok prompt on real Nərimanov photos, seed realistic
  demo data, prep the demo script + Q&A answers.

Everyone unblocked from minute one: B, C, D build against `OPENWAVE_MOCK=1` and the
fixed API contract while A builds the real server.

## Phases
**Phase 0 — Foundation ✅ (done)**
Shared enums, taxonomy (SLA + routing), Grok intake, clustering, models — verified.

**Phase 1 — API up (A, first)**
`main.py` with `/reports` (intake → relevance branch → deadline/route/thread/persist),
`/admin/issues`, `/admin/map`, approve/reject/status, `/admin/orgs`, `/admin/stats`.
Run with mock so B/C can hit a real server immediately.

**Phase 2 — Surfaces in parallel (B, C)**
- B: issues table + map with the heat layer; click → detail panel; approve/route works.
- C: submit flow end-to-end; stepper reads live status; thread view groups reports.

**Phase 3 — Real AI + threading on real data (A, D)**
Swap to real `XAI_API_KEY`; verify relevance gate rejects junk and clustering folds
duplicates within 75 m. Tune severity/category prompt wording on sample photos.

**Phase 4 — Accountability + delight (A, B, C)**
PDF export (`/admin/export.pdf`), CSV import (seed history so the map looks alive),
rewards screen + coin awards on resolve. Empty states, AZ copy pass.

**Phase 5 — Demo lock (D + all)**
Seed the golden-path data so it's one tap on stage. Rehearse the 5-minute run and
the Q&A answers below. Freeze code; only fix demo-breaking bugs after this.

## Rubric → where the points are
| Criterion | Bal | Won by |
|---|---|---|
| Texniki İcra (işlək prototip) | 30 | Phase 1–3: a real, running loop, clean code on the verified spine |
| Problemin Həlli & Aktuallıq | 20 | Organizers' own categories + real Nərimanov/Baku orgs |
| İnnovasiya & Kreativlik | 15 | One Grok vision call: relevance + classify + summarize + dedup |
| UX/UI | 15 | Two clean surfaces; shared status enum; clear AZ copy |
| Tətbiqolunma (Feasibility) | 10 | Transparent SLA table + fixed routing + import/export → integratable |
| Təqdimat | 10 | Rehearsed golden-path demo + the Q&A answers below |

## Q&A answers to have ready (jury asks these)
- **"How is the deadline decided?"** → A policy SLA table (category × severity), not
  an AI guess. Show `taxonomy.SLA_DAYS`.
- **"What if the AI is wrong?"** → It never decides; every issue passes `manual_review`,
  operator can override category/severity/org. AI is a fast first pass.
- **"Where does a report go?"** → Fixed routing map to real bodies (flooding→Azərsu,
  waste→Təmiz Şəhər, lighting→Bakıişıq, facade→MKTB…), operator can reassign.
- **"How does a government body adopt this?"** → Stable status/category contract,
  CSV import of legacy data, PDF activity export — it slots into existing workflow.
- **"How do you stop spam/fake reports?"** → AI relevance gate + per-user credibility
  score that throttles repeat offenders.
- **"Why threads, not one-report-one-ticket?"** → De-dups the queue and turns
  reach into priority: 10 reports of one pothole = one urgent issue, not 10 tickets.

## Out of scope (say so if asked — it's a strength, not a gap)
Real merchant integration for rewards (coins are real, the shop is mocked); real
auth/SSO (demo uses simple user ids); native push (status is polled).
