# 01 – Backend: Raindrop + Vultr

Goal: **Make the Flask backend obviously “built on Raindrop + Vultr”** while keeping local dev easy.

---

## 1. Raindrop SmartInference as the primary mission path

**Target files (adjust if v2 moved things):**

- `raindrop-backend/app.py`
- `raindrop-backend/generate_quest.py`
- `raindrop-backend/generate_quest_day3.py` (if still present)

### 1.1 Environment variables

Expect these env vars in production (Raindrop deployment):

- `RAINDROP_API_URL` – base URL for SmartInference endpoint
- `RAINDROP_API_KEY` – API key/token for Raindrop
- `DATABASE_URL` – Postgres connection string (Vultr managed DB or SmartSQL)
- `APP_ENV` – e.g. `local` vs `production` (optional but helpful)

Create **`raindrop-backend/.env.example`** with **fake** values, e.g.:

```bash
RAINDROP_API_URL=https://smartinference.example.raindrop.ai
RAINDROP_API_KEY=YOUR_RAINDROP_API_KEY_HERE
DATABASE_URL=postgresql://user:password@host:5432/dbname
APP_ENV=local
```

Do **not** commit a real `.env` – only `.env.example`.

### 1.2 Make SmartInference the default for mission generation

In `generate_quest.py` (or a consolidated generator module):

1. Keep the existing local, rule-based generator as a **fallback**.
2. Implement a helper like:

```python
def _raindrop_client_from_env():
    url = os.getenv("RAINDROP_API_URL")
    key = os.getenv("RAINDROP_API_KEY")
    if not url or not key:
        return None
    return RaindropClient(base_url=url, api_key=key)
```

3. In `generate_quest(...)`:

- If a Raindrop client is available, call SmartInference to generate the mission (and clarifying questions if desired).
- If not, fall back to local logic so devs can still run the app without Raindrop credentials.

If `generate_quest_day3.py` contains the “clarifying questions + SmartInference” path, either:

- Merge that logic into `generate_quest.py`, or
- Import `generate_quest_day3` into `app.py` and use it as the main generator.

**Important:** in the **deployed** backend, Raindrop vars will be set, so SmartInference will always be used.

---

## 2. Swap SQLite → Vultr Managed Postgres (or SmartSQL)

Right now (per Roadmap2/Convo 11), `app.py` uses `sqlite3` and a local `quests.db`. We want to:

- Use **Vultr Managed PostgreSQL** (or Raindrop SmartSQL backed by Vultr) for persistence.
- Still allow an SQLite fallback for pure local dev if you want.

### 2.1 Choose a simple schema

Keep it minimal; something like:

```sql
CREATE TABLE IF NOT EXISTS quests (
    id SERIAL PRIMARY KEY,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    quest_json JSONB
);
```

- `session_id` – link multiple quests to a browser session / user.
- `quest_json` – full mission payload (including SGXP and checklist).

### 2.2 Add a Postgres DB helper

Create `raindrop-backend/db.py` (or similar) with thin wrappers:

```python
import os
import json
import psycopg2
from psycopg2.extras import Json, RealDictCursor

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg2.connect(DATABASE_URL)

def init_schema():
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS quests (
                id SERIAL PRIMARY KEY,
                session_id TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                quest_json JSONB
            );
            """
        )
        conn.commit()

def insert_quest(session_id, quest_payload):
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO quests (session_id, quest_json)
            VALUES (%s, %s)
            RETURNING id, created_at;
            """,
            (session_id, Json(quest_payload)),
        )
        row = cur.fetchone()
        conn.commit()
        return row

def list_quests(session_id, limit=20):
    with get_connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, session_id, created_at, quest_json
            FROM quests
            WHERE session_id = %s
            ORDER BY created_at DESC
            LIMIT %s;
            """,
            (session_id, limit),
        )
        return cur.fetchall()
```

You can adapt naming/paths to whatever v2 is using; the key is:

- Use **Postgres** in production.
- Store full quest payloads as JSONB so we can reconstruct the HUD state if needed.

### 2.3 Wire the Flask API to Postgres

In `app.py`:

1. Import the DB helpers and call `init_schema()` on startup (gate with `APP_ENV` if you want).
2. When a quest is generated, **always** insert it into Postgres:

```python
quest = generate_quest(form_data)
session_id = get_session_id_from_request(request)
insert_quest(session_id, quest)
```

3. For any “previous missions” endpoint or SGXP summary endpoint, read from Postgres:

```python
quests = list_quests(session_id)
```

You can keep a SQLite-only local path if you want, but for judging:

- The Raindrop deployment must have `DATABASE_URL` pointing to **Vultr Postgres**.

---

## 3. Local dev vs production behavior

### Local dev

- Can still run `python app.py` and hit `http://localhost:5000`.
- If `DATABASE_URL` is not set:
  - Either use an in-memory or SQLite DB, or
  - Fail loudly with a helpful error.
- If Raindrop vars are missing, fall back to local quest generation.

### Production (Raindrop deployment)

- `APP_ENV=production`
- `RAINDROP_API_URL` and `RAINDROP_API_KEY` **must** be set.
- `DATABASE_URL` **must** point to a Vultr-managed Postgres (or SmartSQL connection string).
- On startup:
  - Initialize schema.
  - Use SmartInference for all mission generation calls.

---

## 4. Quick validation steps

Once code changes are in:

1. From a Python REPL or temp script, test DB connection using `DATABASE_URL` (with a non-secret local or staging instance).
2. Hit the mission endpoint locally with Raindrop credentials loaded (e.g. via `.env` and `python-dotenv`) and ensure:
   - SmartInference is called (check logs / debug prints).
   - A quest row is inserted in Postgres.
3. Confirm that local fallback still works with Raindrop env vars unset (for dev ergonomics).

After this doc is implemented, the backend will be ready for deployment via Raindrop MCP (see `02_backend_deploy_raindrop.md`).
