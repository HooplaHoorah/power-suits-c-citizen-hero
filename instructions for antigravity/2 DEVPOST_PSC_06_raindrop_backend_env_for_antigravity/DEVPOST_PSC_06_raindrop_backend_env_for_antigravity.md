# Antigravity Handoff – Raindrop Backend Env Wiring (Step 2)

Repo: `power-suits-c-citizen-hero`  
Focus: `raindrop-backend/` + environment variables for Raindrop SmartInference.

This doc tells **Antigravity** what to do in the repo so Richard can safely plug in his Raindrop API key and later point the app at a real SmartInference endpoint – **without ever committing secrets**.

---

## 0. High‑level goals

1. Keep the existing fallback quest generator working exactly as is.
2. Make it crystal‑clear how to supply:
   - `RAINDROP_API_URL` – the SmartInference endpoint (to be created later).
   - `RAINDROP_API_KEY` – the secret API key Richard created in Raindrop.
3. Ensure secrets stay out of Git (and DevPost) while still being easy to set locally or on a server.

The backend already reads these env vars in `raindrop-backend/generate_quest.py`:

```python
api_url = os.getenv("RAINDROP_API_URL")
api_key = os.getenv("RAINDROP_API_KEY")
```

If either is missing, it falls back to the built‑in quest template. We’re just tightening the developer experience around those env vars.

---

## 1. Confirm repo state (sanity check)

**Files of interest**

- `raindrop-backend/app.py`
- `raindrop-backend/generate_quest.py`
- `raindrop-backend/manifest.yaml`
- `docs/run-instructions.md`
- `.gitignore` at repo root

**Checks**

1. `.gitignore` already contains:

   ```gitignore
   .env
   .env.local
   ```

   → If those lines are missing for any reason, add them back.  
   → Do **not** add `.env.example` to `.gitignore` – that file will be committed as a template.

2. Verify that `docs/run-instructions.md` still describes the optional Raindrop SmartInference integration and mentions the `RAINDROP_API_URL` / `RAINDROP_API_KEY` env vars. No changes needed unless that section is missing.

---

## 2. Add an env template (committed, no secrets)

**Task A – Create `.env.example` in the repo root (if it doesn’t already exist).**

Path: `./.env.example`

Contents:

```env
# Template environment variables for Power Suits C™: Citizen Hero™

# Optional: Raindrop SmartInference endpoint.
# When set, the backend will call this URL with JSON payload:
#   { "mission_idea": "...", "help_mode": "supplies|awareness|helpers" }
# and expect a JSON quest object in return.
RAINDROP_API_URL=https://your-raindrop-smartinference-endpoint.example.com

# Optional: Raindrop API key (SECRET – DO NOT COMMIT REAL VALUE).
# Richard will paste the real key into a local .env or host env var.
RAINDROP_API_KEY=changeme_raindrop_api_key
```

Notes:

- This file is safe to commit – it contains **only placeholders**.
- Do **not** paste the real API key here.
- This template is just for humans and deployment scripts to know which env vars exist.

Commit this file:

```bash
git add .env.example
git commit -m "Add Raindrop env template (.env.example)"
```

---

## 3. Local `.env` usage (untracked, contains real secret)

This part is **for Richard / runtime**, not for Git.

No repo changes needed, but document the expected pattern so anyone reading the code understands it.

### Task B – Document local env pattern in `docs/run-instructions.md`

Append a short subsection near the existing Raindrop section, for example:

> ### Using Raindrop in local dev (optional)
>
> 1. Copy `.env.example` to `.env` in the repo root:
>    ```bash
>    cp .env.example .env
>    ```
> 2. Edit `.env` and:
>    - Replace `RAINDROP_API_URL` with the SmartInference endpoint URL once it exists.
>    - Replace `RAINDROP_API_KEY` with the real Raindrop API key Richard provides out‑of‑band.
> 3. Start the backend in a shell that loads `.env` (for example using `python-dotenv` or your shell’s env export mechanism).
>
> If these variables are not set, the backend will fall back to the built‑in “Operation Cozy Paws” quest template, so the app still works offline.

You don’t need to install or configure `python-dotenv` inside the repo for this handoff; the instructions can stay tool‑agnostic and assume the environment is exported before running `app.py`.

Commit the docs change:

```bash
git add docs/run-instructions.md
git commit -m "Document Raindrop env usage and .env pattern"
```

---

## 4. No key leakage policy

Richard has shared a **real Raindrop API key** in a separate secure channel. That key **must never** appear in:

- Git commits
- Markdown docs
- Logs checked into the repo
- DevPost submission materials

Rules for Antigravity:

1. Treat the key as an opaque secret string – do **not** echo or hard‑code it anywhere.
2. Do not create or modify `.env` files on behalf of Richard; those should be edited manually on his machine or in the deployment environment.
3. It’s OK to:
   - Reference the env var **name** (`RAINDROP_API_KEY`)
   - Describe where the value should be pasted (e.g., local `.env`, Netlify/Vultr secrets, or Raindrop environment config)
   - Assume it will be present when the backend is running in “connected to Raindrop” mode.

---

## 5. Smoke test checklist (no Raindrop required yet)

Once the above changes are committed:

1. Follow `docs/run-instructions.md` to:
   - Create / activate the virtual environment
   - Install backend dependencies
   - Run the backend via `python raindrop-backend/app.py`
2. **Without** setting `RAINDROP_API_URL` or `RAINDROP_API_KEY`, hit the local API:
   - `POST http://localhost:5000/api/generate-quest` with a simple JSON body:
     ```json
     {
       "mission_idea": "Help the local animal shelter",
       "help_mode": "supplies"
     }
     ```
   - Confirm you get the fallback “Operation Cozy Paws” quest JSON.
3. Run the tests:
   ```bash
   pytest test_generate_quest.py
   pytest test_app.py
   ```

If all these pass, the repo is ready for the next stage: **actually creating a Raindrop SmartInference endpoint and wiring its URL into `RAINDROP_API_URL`** via deployment‑specific env configuration.

---

## 6. Done / status

When Antigravity has finished these tasks, please:

1. Push the commits to GitHub (`main` branch).
2. Leave a short note in `docs/NOTES.md` under a new heading like “2025‑12‑04 – Raindrop env wiring” summarizing:
   - `.env.example` added
   - `docs/run-instructions.md` updated with Raindrop env usage
   - No secrets committed

After that, Richard can safely:

- Paste his real Raindrop API key into a local `.env` or hosting provider env settings.
- Later, plug in the real SmartInference URL once a Raindrop service is deployed.
