# 04 – Repo docs cleanup & alignment

Goal: **Make the repo self-explanatory and aligned with the actual architecture** (Raindrop + Vultr + live HUD), so a judge or reviewer doesn’t have to guess.

---

## 1. README refresh

Target: top-level `README.md`.

Recommended sections:

1. **Project name & tagline**  
   - _Power Suits C™: Citizen Hero™_  
   - One–two sentences describing the concept (“sci‑fi suit OS that turns civic action into quests,” etc.).

2. **High-level architecture**  
   Brief bullet list, mirroring the demo script:

   - Minimal web app with:
     - Browser HUD (`frontend/`)
     - Flask API (`raindrop-backend/`)
   - Backend is deployed on **Raindrop** and uses:
     - **Raindrop SmartInference** for mission generation
     - **Vultr Managed PostgreSQL** (or SmartSQL) for mission persistence

3. **Key URLs**  
   - Live HUD: `https://citizen-hero-hud.netlify.app` (or final URL)
   - Backend base: `https://citizen-hero-backend.raindrop.app` (or final URL)
   - Demo video: `<YouTube/Vimeo link>`
   - Public repo (if this README lives inside a subfolder, point to root).

4. **How to run locally**  
   Minimal steps, e.g.:

   ```bash
   cd raindrop-backend
   python -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt

   # Copy .env.example to .env and fill in local RAINDROP/DATABASE values if desired
   cp .env.example .env

   python app.py
   ```

   Then open `frontend/index.html` via a simple static server or VSCode Live Server and point it at `http://localhost:5000`.

5. **How it uses Raindrop + Vultr**  
   - One short paragraph explaining:
     - SmartInference path.
     - Postgres persistence.
     - Raindrop deployment.

6. **License**  
   - Confirm the existing MIT license is referenced and matches the `LICENSE` file.

---

## 2. Update existing docs

Check `docs/` for:

- `run-instructions.md`
- `how-it-works.md`
- Any “Day N” progress logs

Make sure they don’t claim things that are no longer true (e.g. “uses SQLite only” or “Vultr is planned later”).

### 2.1 `run-instructions.md`

- Add a **“Local dev”** section (SQLite / local DB or Postgres test DB).  
- Add a **“Production (Raindrop)”** section stating that judges should use the live HUD URL instead of running locally.

### 2.2 `how-it-works.md`

- Update the “stack” section to say something like:

  > Citizen Hero is a minimal web app built on the Raindrop platform.  
  > The browser HUD talks to a Flask API deployed via Raindrop MCP. Missions are generated via Raindrop SmartInference and stored in a Vultr Managed PostgreSQL database.

- If SmartMemory / SmartSQL are actually used in v2, mention them explicitly; otherwise don’t promise more than exists in code.

### 2.3 Progress logs

- It’s fine to keep the “Day N” logs as historical context, but consider adding a top note like:

  > **Note:** This log reflects the hackathon build-up. For the final DevPost submission, see the main README and this `/docs` folder for the current architecture.

---

## 3. Repo structure overview

Consider adding a small `docs/repo-structure.md` with something like:

```text
/
├─ frontend/             # Browser HUD
├─ raindrop-backend/     # Flask API deployed via Raindrop
│   ├─ app.py
│   ├─ generate_quest.py
│   ├─ db.py
│   ├─ manifest.yaml
│   └─ .env.example
├─ docs/                 # Architecture, run instructions, etc.
├─ LICENSE               # MIT
└─ README.md
```

This helps judges and future collaborators orient quickly.

---

## 4. Consistency pass

After edits:

1. Search the repo for `sqlite3`, `quests.db`, or anything that contradicts “Postgres + Raindrop” in production.
2. Make sure any mentions of “future work” are clearly labeled as such and don’t confuse the baseline feature set being judged.
3. Confirm that any hard-coded URLs in docs match the final live HUD + backend URLs.

Once this doc is implemented, the repo should tell a clean, truthful story that matches what the judges will actually experience.
