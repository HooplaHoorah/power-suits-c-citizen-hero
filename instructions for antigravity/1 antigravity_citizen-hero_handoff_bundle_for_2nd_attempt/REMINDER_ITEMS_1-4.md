# Reminder – Completed Items 1‑4

## 1️⃣ Manifest with Environment Variables
- Added `raindrop-backend/manifest.yaml` that defines the service, entrypoint, API routes, **and** an `env:` block with:
  - `RAINDROP_API_URL`
  - `RANDROP_API_KEY`
  - `DATABASE_URL`
  - `APP_ENV=production`

## 2️⃣ README Update
- Overwrote `README.md` with full documentation covering:
  - Local development steps
  - Production deployment (backend on Raindrop, frontend static host)
  - Required environment variables
  - SmartInference optional integration

## 3️⃣ Frontend Config & URL Handling
- Created `frontend/config.js` exporting `API_BASE_URL` that automatically selects:
  - `http://localhost:5000` for dev (when hostname is localhost or 127.0.0.1)
  - `https://citizen-hero-backend.raindrop.app` for production.
- Updated **all** fetch calls in `frontend/new_script.js` to use `${API_BASE_URL}`.
- Inserted `<script src="config.js"></script>` before `new_script.js` in `frontend/index.html`.

## 4️⃣ Backend DB Helper & Endpoint
- Added `raindrop-backend/db.py` with Postgres helpers:
  - `init_schema()`, `insert_quest()`, `list_quests()`, **`get_quest_by_id()`**.
- Re‑wrote `raindrop-backend/app.py` to:
  - Use the new DB helpers.
  - Provide a health‑check endpoint (`/healthz`).
  - Enable CORS.
  - Manage a session cookie (`session_id`).
  - Expose a proper `/quests/<id>` endpoint that returns a single quest from Postgres.

These four items are now fully implemented in the repository. Item 5 (DevPost submission checklist) will be addressed later.
