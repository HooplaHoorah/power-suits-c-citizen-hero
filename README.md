# Power Suits C: Citizen Hero

**Power Suits C: Citizen Hero** is a Raindrop + Vultr powered web app that turns everyday problems into real‑world **Hero Quests**.

Users type in something that’s bugging them in their world, choose how they want to help (raise supplies, raise awareness, or organize helpers), and the Suit Brain generates:

- A quest name and mission summary  
- 3–5 concrete steps
- SGXP (Super Greatness XP) rewards for each step
- Reflection prompts and safety notes

For the AI Champion Ship hackathon, this repo contains:

- `frontend/` – single‑page web UI for idea intake and quest HUD  
- `raindrop-backend/` – Raindrop app configuration and API handlers  
- `docs/` – architecture diagrams, prompts, and hackathon notes

## Tech Stack (planned)

- **Frontend:** HTML/JS (static site), deployed via Netlify/Vercel/Cloudflare Pages
- **Backend:** Raindrop Platform
  - SmartInference – Suit Brain prompt chain
  - SmartSQL / SmartMemory – quest storage & retrieval
- **Infra:** Vultr Managed PostgreSQL

## Running Locally

1. **Install Python dependencies** (Flask, Flask‑CORS, `psycopg2‑binary`, `requests`). If a `requirements.txt` appears, run `pip install -r requirements.txt`.
2. **Create a local `.env`** file by copying `.env.example`. You can leave the variables empty – the backend will fall back to the local rule‑based generator and will not attempt to connect to Postgres.
3. **Start the backend**:
   ```bash
   cd raindrop-backend
   python app.py
   ```
   The Flask server will serve the static `frontend/` folder on `http://localhost:5000`.
4. **Open the HUD** in a browser at `http://localhost:5000`. The UI automatically uses the dev API base URL.

## Production Deployment

### Backend (Raindrop MCP)
1. **Manifest** – `raindrop-backend/manifest.yaml` already defines the service name, entrypoint, API routes, and now includes the required environment variables.
2. **Set environment variables** in the Raindrop console:
   - `RAINDROP_API_URL` – SmartInference endpoint base URL
   - `RAINDROP_API_KEY` – API key/token for Raindrop
   - `DATABASE_URL` – PostgreSQL connection string (Vultr Managed PostgreSQL or Raindrop SmartSQL)
   - `APP_ENV=production`
3. **Deploy the service** via the Raindrop MCP workflow. After deployment you will receive a public base URL such as `https://citizen-hero-backend.raindrop.app`.
4. **Health‑check**: `GET https://<your‑backend>/healthz` should return `{ "status": "ok" }`.

### Frontend (Static Site)
1. Push the repo to a public GitHub repository.
2. Connect the repo to Netlify, Vercel, or Cloudflare Pages.
3. Set the **publish directory** to `frontend/`.
4. The frontend automatically uses `config.js` to point to the production backend URL when it is not running on `localhost`.
5. After deployment you will receive a URL like `https://citizen-hero-hud.netlify.app` – use this as the **Live Deployed App** in DevPost.

## Environment Variables (Backend)

- **`RAINDROP_API_URL`** – Base URL for the SmartInference API. Required in production.
- **`RAINDROP_API_KEY`** – Secret token for authenticating with SmartInference.
- **`DATABASE_URL`** – PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/db`).
- **`APP_ENV`** – Set to `production` on Raindrop; can be omitted or set to `local` for development.

A placeholder `.env.example` file is provided in `raindrop-backend/`. **Never commit real secrets**.

## SmartInference Integration (Optional)

Citizen Hero includes a pluggable quest engine that can be upgraded from the built‑in rule‑based generator to the Raindrop SmartInference API. By default, the app runs entirely locally, using a templated quest generator.

```text
RAINDROP_API_URL=<your‑raindrop‑endpoint>
RAINDROP_API_KEY=<your‑secret‑api‑key>
```
When both environment variables are present at runtime, the backend automatically sends your mission idea and clarifying details to Raindrop's SmartInference endpoint. Leaving these variables unset keeps all generation local and avoids any external API calls or billing. **Do not commit your API keys**.
When both environment variables are present at runtime, the backend automatically sends your mission idea and clarifying details to Raindrop's SmartInference endpoint. The response is used to generate richer, more varied quests. Leaving these variables unset keeps all generation local and avoids any external API calls or billing. **Do not commit your API keys**.

© 2025 Hoopla Hoorah. Power Suits C™, Citizen Hero™, Super Greatness Experience Points™, and SGXP™ are trademarks of Hoopla Hoorah. All rights reserved. Created by Richard A. Morgan.
