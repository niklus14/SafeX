# API Specification

Base URL (dev): `http://localhost:8000`. All bodies/responses are JSON unless
marked `multipart`. **All `status` and `category` values are exactly the strings
in `enums.py`** — see [DATA_MODEL.md](DATA_MODEL.md). Build both frontends against
this; with `OPENWAVE_MOCK=1` the intake is faked so no key is needed.

Conventions: times are ISO-8601 UTC. Errors return `{ "detail": "<message>" }`
with an appropriate 4xx/5xx code.

---

## Citizen

### `POST /users`  — register a citizen (demo-simple, no real auth)
```json
// req
{ "display_name": "Aysel", "phone": "+994..." }
// res 200
{ "id": 1, "display_name": "Aysel", "credibility": 100, "coins": 0 }
```

### `POST /reports`  — submit a report  *(multipart)*
Fields: `image` (file), `description` (string, citizen's own words), `lat`,
`lng`, `user_id`.
```json
// res 200 — accepted
{
  "is_relevant": true,
  "issue_id": 42,
  "joined_thread": true,            // true if folded into an existing issue
  "status": "manual_review",
  "category": "fountain",
  "severity": "medium",
  "title_az": "Fontan işləmir",
  "deadline": "2026-06-08T00:00:00Z"
}
// res 200 — rejected by AI relevance gate
{
  "is_relevant": false,
  "rejection_reason_az": "Şəkil ictimai problemi göstərmir.",
  "credibility": 90                 // updated score after the ding
}
```
Server flow: `analyze_image` → relevance branch → `compute_deadline` +
`suggest_org` + `find_thread` → persist `Report` (stores `user_text`) + `Issue`.

### `GET /issues/{id}`  — issue detail + its thread
```json
{
  "id": 42, "category": "fountain", "severity": "medium",
  "title_az": "Fontan işləmir", "description_az": "...",
  "status": "in_progress", "deadline": "2026-06-08T00:00:00Z",
  "lat": 40.409, "lng": 49.867,
  "org": { "key": "abadliq", "name_az": "Nərimanov RİH — Abadlıq..." },
  "report_count": 4,
  "reports": [                       // root first (the "main" post), then replies
    { "id": 100, "user_text": "Fontan işləmir, su axmır",
      "image_url": "...", "created_at": "...", "is_root": true },
    { "id": 113, "user_text": "Hələ də düzəlməyib", "image_url": "...",
      "created_at": "...", "is_root": false }
  ]
}
```

### `GET /me/{user_id}`  — citizen profile, contributions, coins
```json
{
  "id": 1, "display_name": "Aysel", "credibility": 90, "coins": 35,
  "reports": [ { "issue_id": 42, "status": "in_progress", "title_az": "...",
                 "created_at": "..." } ]
}
```

### `GET /rewards`  — redeemables catalog  *(marketplace is mocked)*
```json
[ { "id": "r1", "title_az": "Kofebişirmə endirimi 20%", "cost_coins": 50,
    "partner": "Demo Coffee" } ]
```

---

## Admin

### `GET /admin/issues`  — queue for table + thread views
Query params: `status`, `category`, `org_key`, `sort` (`priority`|`deadline`|`created`),
`page`, `page_size`. All optional.
```json
{
  "total": 128,
  "items": [
    { "id": 42, "title_az": "Fontan işləmir", "category": "fountain",
      "severity": "medium", "status": "manual_review", "priority": 45.0,
      "report_count": 4, "org_key": "abadliq",
      "deadline": "2026-06-08T00:00:00Z", "ai_confidence": 0.83,
      "lat": 40.409, "lng": 49.867 }
  ]
}
```

### `GET /admin/map`  — heatmap / dots layer (same data, map shape)
```json
[ { "id": 42, "lat": 40.409, "lng": 49.867, "category": "fountain",
    "report_count": 4, "priority": 45.0, "intensity": 0.56, "color": "#e23b2e" } ]
```
`intensity` (0–1) and `color` come from `clustering.heat_intensity/heat_color`.
The "dots vs threads" toggle is two renderings of this same array.

### `POST /admin/issues/{id}/approve`  — confirm/override AI, route it
```json
// req (all optional overrides; omitted fields keep the AI/default value)
{ "severity": "high", "category": "fountain", "org_key": "abadliq",
  "deadline": "2026-06-05T00:00:00Z", "operator_notes": "Təcili" }
// res 200
{ "id": 42, "status": "routed", "org_key": "abadliq",
  "deadline": "2026-06-05T00:00:00Z" }
```
Overriding `category` or `severity` recomputes the default deadline unless an
explicit `deadline` is sent. Recomputes `priority`.

### `POST /admin/issues/{id}/reject`
```json
// req
{ "rejection_reason_az": "Bu, Nərimanov rayonuna aid deyil." }
// res 200
{ "id": 42, "status": "rejected" }
```

### `POST /admin/issues/{id}/status`  — advance lifecycle
```json
// req  (routed → in_progress → resolved)
{ "status": "resolved" }
// res 200
{ "id": 42, "status": "resolved" }
```
On `resolved`, award coins to contributing citizens (see DATA_MODEL → rewards).

### `GET /admin/orgs`  — list responsible bodies (for the assign dropdown)
```json
[ { "key": "azersu", "name_az": "“Azərsu” ASC", "scope": "city_utility" } ]
```

### `GET /admin/stats`  — dashboard cards + export header
```json
{ "open": 73, "resolved": 51, "overdue": 9, "avg_resolution_days": 6.2,
  "by_category": { "waste": 18, "lighting": 12 },
  "by_status": { "manual_review": 14, "routed": 22, "in_progress": 37 } }
```

### `POST /admin/import`  — import historical issues  *(multipart)*
File: `file` (csv/txt). Columns per `data/sample_import.csv`:
`external_id, category, severity, title_az, description_az, lat, lng, status,
created_at, org_key`.
```json
// res 200
{ "imported": 8, "skipped": 0 }
```

### `GET /admin/export.pdf`  — activity account (real PDF)
Returns `application/pdf`: a dated report of issues handled, by status/category,
with resolution stats. This is the feasibility/accountability story for the jury.

---

## Status & error notes
- `403` if a user below a credibility threshold submits (anti-spam throttle).
- Invalid `status`/`category` → `422`.
- `/reports` never 500s on a bad photo — intake falls back to `category=other` +
  `manual_review` so the queue is the safety net.
