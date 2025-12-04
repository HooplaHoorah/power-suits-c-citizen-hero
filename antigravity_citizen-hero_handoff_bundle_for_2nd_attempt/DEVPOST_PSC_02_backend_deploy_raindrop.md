# 02 – Backend deployment on Raindrop MCP

Goal: **Run the Flask API on Raindrop, exposed via a public URL**, using the manifest + env vars defined in the backend.

This doc assumes you have access to the Raindrop console and to their MCP deployment flow.

---

## 1. Check / update the Raindrop manifest

Look for a manifest file (naming may vary):

- `raindrop-backend/manifest.yaml`
- or `raindrop-backend/raindrop-manifest.yaml`

It should describe the service, routes, and runtime. If it doesn’t exist or is outdated, update it using Raindrop’s current template for Python/Flask apps. Key points:

- Entrypoint should be `app.py` (or whatever v2 uses as the Flask entry).
- Routes should include at least:
  - Mission generation endpoint (e.g. `/api/generate-quest`)
  - Any supporting endpoints (mission history, health check, etc.).

If needed, add a simple **health-check endpoint** in `app.py`:

```python
@app.route("/healthz", methods=["GET"])
def healthz():
    return {"status": "ok"}, 200
```

and expose it in the manifest.

---

## 2. Set environment variables in Raindrop

In the Raindrop console (service config):

Set these env vars for the **production** deployment:

- `APP_ENV=production`
- `RAINDROP_API_URL=...` (SmartInference endpoint base URL)
- `RAINDROP_API_KEY=...` (API key/token)
- `DATABASE_URL=...` (Vultr Postgres / SmartSQL connection string)
- Any other secrets / settings the app expects.

**Do not** hardcode secrets in the manifest; use Raindrop’s environment configuration.

---

## 3. Deploy the service

Using Raindrop’s MCP workflow (names may differ slightly depending on UI version):

1. Create or update a Service using the repo / `manifest.yaml`.
2. Choose the correct runtime (Python version) and buildpack / Docker template.
3. Trigger a deploy.
4. Wait for Raindrop to assign a **public base URL**, something like:

   ```text
   https://citizen-hero-backend.raindrop.app
   ```

5. Verify logs show:
   - Schema init hitting Postgres (once, at startup).
   - No connection / auth errors to Raindrop SmartInference.

---

## 4. Smoke-test the deployed API

From your local machine (or a simple `curl` in a shell):

1. Health check

```bash
curl -i https://citizen-hero-backend.raindrop.app/healthz
```

Expect `200 OK` and a small JSON payload.

2. Mission generation (adjust path to match app)

```bash
curl -i -X POST   -H "Content-Type: application/json"   -d '{"focus":"local community","time_budget":"1–2 hours","player_profile":"teen"}'   https://citizen-hero-backend.raindrop.app/api/generate-quest
```

Confirm:

- Response includes a **mission** and SGXP breakdown.  
- Logs indicate SmartInference was called (not just local fallback).  
- A row was inserted into the Postgres `quests` table for that request.

If you have an endpoint for listing recent quests, hit that too and confirm Postgres data is wired correctly.

---

## 5. CORS / origin config

Since the HUD will be hosted under a different domain (e.g. Netlify or Vercel), make sure the Flask app allows cross-origin requests from that origin.

Simplest path (if not already done):

- Add `flask-cors` to dependencies.
- In `app.py`:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

For extra strictness, you can narrow `origins` later to just the Netlify/Vercel domain once it’s known.

---

## 6. Mark Raindrop as the canonical production backend

Once the above is working, treat the Raindrop deployment as **the** production backend for:

- The HUD demo in the video.
- The live app URL used for judging.
- All DevPost submission copy.

This URL (or the HUD URL that calls it) is what should be referenced in:

- DevPost “Live Deployed App” field.
- README “Production URL” section.
- Any “how to try it” instructions.

After this doc is implemented, the backend will be ready to support a public HUD (see `03_frontend_live_url.md`).
