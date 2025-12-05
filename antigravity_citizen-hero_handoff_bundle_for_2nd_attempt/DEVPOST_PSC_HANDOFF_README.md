# DevPost – PSC – Citizen Hero handoff (for Google Antigravity)

**Project:** Power Suits C™: Citizen Hero™  
**Context:** DevPost – PSC – AI Championship submission  
**Build:** `power-suits-c-citizen-hero_v2` (local repo)

This folder is a small “mission briefing” for bringing the v2 repo **back onto the roadmap** from _Roadmap 2 / Convo 11_ and making it clearly compliant with the DevPost challenge requirements.

At a high level, we need to:

1. **Make the backend clearly “built & deployed on Raindrop”**  
   - Flask API deployed via Raindrop MCP.  
   - Mission generation path actually calling Raindrop SmartInference in the deployed environment.

2. **Integrate a real Vultr service (Postgres) instead of only SQLite**  
   - Store missions / SGXP ledger in **Vultr Managed PostgreSQL** (or Raindrop SmartSQL backed by Vultr).  
   - Keep a simple local-dev path if helpful, but production/judging must hit Vultr.

3. **Provide a public URL to the live HUD**  
   - Minimal static deploy (Netlify/Vercel/Cloudflare/etc.).  
   - HUD points at the Raindrop-hosted backend URL.

4. **Tighten repo docs & DevPost story**  
   - README + docs reflect what’s _actually_ running.  
   - DevPost fields list Raindrop + Vultr services accurately.  
   - Demo video URL + live app URL + repo URL are all in sync.

The other `.md` files in this folder spell out concrete tasks.

---

## Recommended order of operations

1. **01 – Backend: Raindrop + Vultr**  
   - Make Raindrop SmartInference the primary mission generator.  
   - Wire persistence to Vultr Managed Postgres (or SmartSQL).  
   - Preserve a sane local-dev flow.

2. **02 – Backend deployment on Raindrop MCP**  
   - Use `manifest.yaml` (or equivalent) to deploy the Flask API via Raindrop.  
   - Configure env vars (Raindrop + Postgres).  
   - Smoke-test from a curl / browser.

3. **03 – Frontend live URL**  
   - Deploy `frontend/` as static site.  
   - Point it at the Raindrop backend URL.  
   - Fix any CORS issues.

4. **04 – Repo docs cleanup**  
   - README + docs updated to match reality.  
   - Short “how it works” + “how to run locally + production” sections.

5. **05 – DevPost submission checklist**  
   - Make sure nothing is missing (live URL, Vultr integration, Raindrop deployment, video, repo access).

---

## Assumptions about the v2 repo

Adjust paths as needed if v2 changed structure, but the docs assume something close to:

- **Backend**: `raindrop-backend/`
  - `app.py` – Flask API
  - `generate_quest.py` / `generate_quest_day3.py` – mission generator(s)
  - `manifest.yaml` – Raindrop service manifest (or similar)
- **Frontend**: `frontend/`
  - `index.html`, `style.css`, `script.js` (or equivalent)
- **Docs**: `docs/`
  - `run-instructions.md`, `how-it-works.md`, etc.

If any of those moved in v2, treat these instructions as **intent**, not strict paths.

---

## Implementation notes

- **Environment separation**  
  - Local dev is allowed to be more relaxed (optional Raindrop and SQLite fallback).  
  - **Deployed / judging environment must** use Raindrop SmartInference + Vultr Postgres.

- **Secrets**  
  - Never commit real API keys.  
  - Commit **`.env.example`** (see 01-backend doc) with placeholder values only.

- **Minimalism is fine**  
  - The judges don’t need a huge DB schema or massive feature set; they need to see:  
    1. A working HUD.  
    2. A backed-by-Raindrop mission generator.  
    3. A genuine Vultr integration.  
    4. A public URL that works.

From here, follow the docs in numeric order.
