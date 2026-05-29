# Setup

## Prerequisites
- Python 3.11+ (tested on 3.12)
- Node 18+ (for the frontends, once scaffolded)
- An xAI API key for real intake (`XAI_API_KEY`) — optional in mock mode

## Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional
pip install -r requirements.txt

# 1) build the demo DB + seed the 9 real organizations
python -c "from models import init_db; init_db()"

# 2a) DEV with no API key — deterministic fake intake (use this for frontend work)
export OPENWAVE_MOCK=1

# 2b) REAL intake instead — set the key, unset mock
#   export XAI_API_KEY=xai-...
#   unset OPENWAVE_MOCK
#   (model slug is ai_intake.VISION_MODEL = "grok-4.3"; confirm at docs.x.ai)

# 3) run the API (once main.py exists)
uvicorn main:app --reload --port 8000
```

Seed history so the map looks alive in the demo:
```bash
# via API once main.py is up:
curl -F file=@../data/sample_import.csv http://localhost:8000/admin/import
```

## Environment variables
| var | required | purpose |
|---|---|---|
| `XAI_API_KEY` | for real intake | xAI/Grok key |
| `OPENWAVE_MOCK` | no | set to `1` to fake intake (no key needed) |

Copy `.env.example` → `.env` and fill in. **Never commit `.env` or the DB file.**

## Smoke test (no key needed)
```bash
cd backend && OPENWAVE_MOCK=1 python -c "
from ai_intake import analyze_image
from taxonomy import compute_deadline, suggest_org
r = analyze_image(b'demo'*900, 'image/jpeg', user_text='Səkidə buz var')
print(r.category.value, r.severity.value, '->', suggest_org(r.category).name_az,
      '/ deadline', compute_deadline(r.category, r.severity).date())
"
```

## Repo layout
```
openwave/
  README.md            # entry point / overview
  docs/                # ARCHITECTURE · API · DATA_MODEL · BUILD_PLAN · SETUP
  backend/             # enums, taxonomy, ai_intake, clustering, models (+ main.py next)
  data/                # organizations.csv, sample_import.csv
  .env.example
  .gitignore
```
