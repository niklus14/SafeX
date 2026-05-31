# Backend and Frontend Linking Guide

## Overview
The SafeX dashboard consists of:
- **Backend**: FastAPI server (in `back/` folder) - runs on port 8000
- **Frontend**: HTML/CSS/JS dashboard (in `dashboard/front/` folder)

## How to Link and Run

### Step 1: Start the Backend Server

**Option A: Using the batch file (Windows)**
```bash
cd back
start_backend.bat
```

**Option B: Manual command**
```bash
cd back
set OPENWAVE_MOCK=1
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will:
- Initialize the SQLite database (`openwave.db`)
- Seed organizations from taxonomy
- Serve API endpoints at `http://localhost:8000`
- Enable CORS for the frontend

### Step 2: Load Mock Data (Optional)

If you want to load the mock problem data:
```bash
cd back
python seed_mock.py
```

This will add sample issues to the database for testing.

### Step 3: Open the Frontend

Simply open the dashboard HTML file in your browser:
```
dashboard/front/dashboard.html
```

Or use a local server:
```bash
cd dashboard/front
python -m http.server 5500
```
Then open: `http://localhost:5500/dashboard.html`

## API Endpoints Used by Frontend

The frontend (`dashboard.js`) calls these backend endpoints:

- `GET /admin/issues?page_size=200` - Get all issues
- `GET /admin/stats` - Get statistics
- `GET /admin/orgs` - Get organizations
- `GET /admin/map` - Get map data
- `GET /issues/{id}` - Get issue details
- `POST /admin/issues/{id}/approve` - Approve issue
- `POST /admin/issues/{id}/status` - Update status
- `POST /admin/issues/{id}/reject` - Reject issue

## Database

The backend uses SQLite (`openwave.db`) with tables:
- `organization` - Responsible organizations
- `issue` - Problem reports
- `report` - Individual citizen submissions
- `user` - Citizen users

## Troubleshooting

**Backend not starting:**
- Check if Python and required packages are installed: `pip install -r requirements.txt`
- Check if port 8000 is already in use

**Frontend can't connect to backend:**
- Ensure backend is running on port 8000
- Check browser console for CORS errors
- Verify API URL in `dashboard.js` is `http://localhost:8000`

**No data showing:**
- Run `python seed_mock.py` to load mock data
- Check database file exists: `back/openwave.db`

## File Structure

```
SafeX/
├── back/
│   ├── main.py              # FastAPI application
│   ├── models.py            # Database models
│   ├── seed_mock.py         # Mock data loader
│   ├── start_backend.bat    # Startup script
│   ├── mock_data.sql        # SQL mock data
│   └── openwave.db          # SQLite database (created on run)
└── dashboard/
    └── front/
        ├── dashboard.html   # Main dashboard page
        ├── dashboard.js     # Frontend logic
        ├── dashboard.css    # Styles
        └── img/             # Category images
```
