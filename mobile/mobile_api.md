# Mobile API Contract

Base URL: `http://localhost:8000` (override via `VITE_API_URL` env var)

All GET requests use bare `fetch`. All POST requests send `multipart/form-data`.  
Enum values are always raw English strings from the backend (`"waste"`, `"in_progress"`, etc.) — the mobile maps them to Azerbaijani display labels internally.

---

## POST /users

Register a citizen. Call once at onboarding; persist the returned `id` in state.

**Request (FormData)**
| Field | Type | Required |
|---|---|---|
| `display_name` | string | ✅ |
| `phone` | string | — |

**Response**
```json
{
  "id": 1,
  "display_name": "Anar Məmmədov",
  "credibility": 100,
  "coins": 0
}
```

**Mobile reads:** `id` → `state.userId`, `credibility` → `user.trustScore`, `coins` → `user.coins`

---

## POST /reports

Submit a citizen report (photo + location). Triggers the full AI intake + clustering pipeline.

**Request (FormData)**
| Field | Type | Required |
|---|---|---|
| `image_url` | string | ✅ (demo; production: `image` File) |
| `description` | string | ✅ |
| `lat` | float string | ✅ |
| `lng` | float string | ✅ |
| `user_id` | int string | ✅ |

**Response — accepted**
```json
{
  "is_relevant": true,
  "issue_id": 5,
  "joined_thread": false,
  "status": "manual_review",
  "category": "road_surface",
  "severity": "high",
  "title_az": "İnşaatçılar prospektində dərin çuxur",
  "deadline": "2026-06-06T20:28:49.907121"
}
```

**Response — rejected**
```json
{
  "is_relevant": false,
  "rejection_reason_az": "Göndərilən şəkil ictimai infrastruktur probleminə aid deyil.",
  "credibility": 90
}
```

**Mobile reads:** `issue_id` → maps local report to backend ID; `joined_thread` → determines xal award type; `is_relevant: false` → shows rejection toast, updates `user.trustScore`

---

## GET /admin/issues?sort=created&page_size=50

Community feed — all open issues sorted by creation time, highest priority first.

**Response**
```json
{
  "total": 18,
  "items": [
    {
      "id": 1,
      "title_az": "İnşaatçılar prospektində dərin çuxur",
      "brief_desc_az": "Prospektin Koroğlu qovşağına yaxın hissəsində böyük çuxur yaranıb.",
      "category": "road_surface",
      "severity": "high",
      "status": "in_progress",
      "priority": 46.0,
      "report_count": 3,
      "org_key": "abadliq",
      "deadline": "2026-06-06T20:28:49.907121",
      "ai_confidence": 0.0,
      "lat": 40.4093,
      "lng": 49.8671,
      "image_url": "https://...",
      "created_at": "2026-05-30T20:28:49.908345",
      "location_az": "İnşaatçılar prospekti, Nərimanov r.",
      "reporter_name": "Anar Məmmədov"
    }
  ]
}
```

**Description fields — feed card renders:**
| Backend field | Shown in | Content |
|---|---|---|
| `title_az` | Card headline | AI-generated, ≤8 words |
| `brief_desc_az` | Not shown in feed | Stored in `report.descr` as fallback for detail view |

**Mobile maps to internal `Report`:**
| Backend | Internal | Notes |
|---|---|---|
| `id` | `id` as `#API-{id}` | Prefixed to distinguish from local reports |
| `title_az` | `title` | Falls back to `BACKEND_CAT[category]` if empty |
| `brief_desc_az` | `descr` | Shown in feed card only |
| `category` | `category` | Mapped via `BACKEND_CAT` to Azerbaijani label |
| `severity` | `severity` | Mapped via `BACKEND_SEV` (`"high"` → `"Yüksək"`) |
| `status` | `status` | Mapped via `BACKEND_STATUS` (see enum table below) |
| `report_count` | `reactionsCount` | Shown as cluster count |
| `image_url` | `imageUrl` | |
| `location_az` | `location` | |
| `reporter_name` | `reporterName` | |
| `created_at` | `time` + `date` | Split into formatted display strings |
| `priority`, `org_key`, `ai_confidence` | — | Unused by mobile; used by dashboard |

**Reporter avatar** is not sent by the backend. Mobile generates it as `https://picsum.photos/seed/u{id}/40/40`.

---

## GET /issues/{id}

Full issue detail — called when a feed card is tapped. Populates the thread + stepper in `ReportDetailScreen`.

**Response**
```json
{
  "id": 1,
  "category": "road_surface",
  "severity": "high",
  "title_az": "İnşaatçılar prospektində dərin çuxur",
  "brief_desc_az": "Prospektin Koroğlu qovşağına yaxın hissəsində böyük çuxur yaranıb.",
  "full_desc_az": "Prospektin Koroğlu qovşağına yaxın hissəsində çuxur var, yağışdan sonra su dolur.",
  "status": "in_progress",
  "deadline": "2026-06-06T20:28:49.907121",
  "created_at": "2026-05-30T20:28:49.908345",
  "lat": 40.4093,
  "lng": 49.8671,
  "location_az": "İnşaatçılar prospekti, Nərimanov r.",
  "org": { "key": "abadliq", "name_az": "Abadlıq şöbəsi" },
  "report_count": 3,
  "reports": [
    {
      "id": 10,
      "user_text": "Prospektin Koroğlu qovşağına yaxın hissəsində çuxur var, yağışdan sonra su dolur.",
      "image_url": "https://...",
      "created_at": "2026-05-30T20:28:49.908345",
      "is_root": true,
      "reporter_name": "Anar Məmmədov"
    }
  ],
  "steps": [
    { "name": "Süni intellekt yoxlaması", "status": "completed", "subtitle": "Problem avtomatik təsdiqləndi" },
    { "name": "Operator yoxlaması",       "status": "completed", "subtitle": "Məlumatlar doğrulandı" },
    { "name": "Quruma yönləndirildi",     "status": "completed", "subtitle": "Abadlıq şöbəsinə göndərildi" },
    { "name": "İcradadır",                "status": "current",   "subtitle": "Briqada əraziyə cəlb olunub" },
    { "name": "Həll edildi",              "status": "pending",   "subtitle": "" }
  ]
}
```

**Description fields — detail screen renders:**
| Backend field | Shown in | Content |
|---|---|---|
| `brief_desc_az` | — | Not shown in detail (feed only) |
| `full_desc_az` | Below title (italic block) | Citizen's own typed description (`root_report.user_text`) |

**Mobile reads:**
- `org.name_az` → `report.authority` (via `UPDATE_REPORT` dispatch)
- `report_count` → `report.reactionsCount`
- `status` → remapped to display label + stepper state
- `steps` → status stepper in detail view
- `reports` (non-root) → X-style thread replies section
- `full_desc_az` → shown in detail hero description block (falls back to `report.descr` for seed data)

---

## GET /me/{user_id}

Citizen profile — called after onboarding to sync backend state.

**Response**
```json
{
  "id": 1,
  "display_name": "Anar Məmmədov",
  "credibility": 92,
  "coins": 1240,
  "reports": [
    {
      "issue_id": 5,
      "status": "in_progress",
      "title_az": "İnşaatçılar prospektində dərin çuxur",
      "category": "road_surface",
      "image_url": "https://...",
      "created_at": "2026-05-30T20:28:49.908345",
      "deadline": "2026-06-06T20:28:49.907121"
    }
  ]
}
```

**Mobile reads:**
| Backend field | Internal |
|---|---|
| `credibility` | `user.trustScore` |
| `coins` | `user.coins` |
| `reports.length` | `user.reportsCount` |
| `reports` filtered by `status === "resolved"` | `user.solvedCount` |

---

## GET /rewards

Static rewards catalogue.

**Response**
```json
[
  {
    "id": "r1",
    "title_az": "Kofe 20% endirim",
    "badge": "20% Endirim",
    "cost_coins": 50,
    "partner": "Demo Coffee",
    "image_url": "https://..."
  }
]
```

**Mobile maps:** `title_az` → `title`, `cost_coins` → `cost`, `image_url` → `imageUrl`. `partner` is received but not stored internally.

---

## Enum values

### Status (`status` field)

| Backend value | Mobile display | Shown in tab |
|---|---|---|
| `ai_review` | Gözləyir | Aktiv |
| `manual_review` | Gözləyir | Aktiv |
| `routed` | Gözləyir | Aktiv |
| `in_progress` | İcradadır | Aktiv |
| `resolved` | Həll edildi | Həll Edilmiş |
| `rejected` | İmtina edildi | Həll Edilmiş |

### Category (`category` field)

| Backend value | Mobile display |
|---|---|
| `facade` | Bina fasadı |
| `green_zone` | Yaşıllıq zonası |
| `flooding` | Subasma |
| `ice` | Buzlaşma |
| `cleanliness` | Təmizlik |
| `waste` | Zibil konteynerləri |
| `road_excavation` | Qazılmış asfalt (bərpa) |
| `road_surface` | Asfalt örtüyü |
| `signage` | Reklam lövhələri |
| `storefront` | Vitrinlər |
| `park_equipment` | Park avadanlığı |
| `fountain` | Fontanlar |
| `sidewalk` | Səki və bardürlər |
| `construction_fence` | Tikinti hasarları |
| `lighting` | İşıqlandırma |
| `other` | Digər |

### Severity (`severity` field)

| Backend value | Mobile display |
|---|---|
| `low` | Aşağı |
| `medium` | Orta |
| `high` | Yüksək |

---

## Notes

- **Local vs API IDs:** API-loaded reports are stored with ID `#API-{backend_id}`. Session-created reports use `#RG-{uuid}`. The mapping `state.apiIssueIds[localId] = backendId` is used to call `GET /issues/{id}`.
- **Reporter avatars:** Backend never sends avatars. Mobile generates them deterministically from `picsum.photos/seed/u{id}/40/40`.
- **`authority` field:** Populated from `org.name_az` when issue detail is fetched. Empty string in the feed list view.
- **Feed description:** Only `brief_desc_az` (AI summary) is shown in feed cards. `full_desc_az` (citizen text) is only shown in the expanded detail view.
- **Seed data:** `data.ts` reports bypass the API entirely — their `descr` field acts as the fallback for `full_desc_az` in the detail screen.
