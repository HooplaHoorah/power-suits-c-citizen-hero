# 03 – Frontend live URL

Goal: **Provide a public URL to the Citizen Hero HUD** that hits the Raindrop-hosted backend.

This is mostly about deployment plumbing; the HUD itself can stay minimal.

---

## 1. Point the HUD at the Raindrop backend

Assuming a basic static frontend (adjust file names as needed):

- `frontend/index.html`
- `frontend/script.js`
- `frontend/style.css`

### 1.1 Add a single source of truth for the API base URL

In `frontend/script.js` (or a new `config.js` imported by it), define:

```javascript
const API_BASE_URL = "https://citizen-hero-backend.raindrop.app"; // replace with real URL
```

Then, wherever you currently call the backend, use:

```javascript
fetch(`${API_BASE_URL}/api/generate-quest`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

This makes it trivial to swap URLs if needed.

### 1.2 Optional: dev vs production switching

If you want a smoother local dev experience, you can add something like:

```javascript
const isLocal = window.location.hostname === "localhost";
const API_BASE_URL = isLocal
  ? "http://localhost:5000"   // local Flask
  : "https://citizen-hero-backend.raindrop.app"; // Raindrop
```

For judging, the deployed HUD will use the Raindrop URL.

---

## 2. Deploy the HUD as a static site

Pick any static host you’re comfortable with (Netlify / Vercel / Cloudflare Pages). The simplest:

### 2.1 Netlify example

1. Push v2 repo to GitHub (public).  
2. In Netlify:
   - “New site from Git” → connect GitHub → select `power-suits-c-citizen-hero_v2` repo.
   - Build settings:
     - Build command: _None_ (static site).
     - Publish directory: `frontend/`.
3. Deploy.

Netlify will give you a URL like:

```text
https://citizen-hero-hud.netlify.app
```

You can later add a custom domain if desired, but it’s not required for the hackathon.

### 2.2 Vercel example (similar idea)

- Add a new project from Git.
- Set root directory to `frontend/`.
- Build output is static.

---

## 3. Verify HUD ↔ backend integration

Once the static site is deployed:

1. Open the HUD URL in an incognito window.
2. Go through the “I care → I did” flow:
   - Fill out focus/constraints.
   - Generate a mission.
   - Check SGXP tally.
3. Confirm:
   - Network tab shows calls to `https://citizen-hero-backend.raindrop.app/...` (or your backend URL).  
   - Responses are 200 OK with mission payloads.  
   - No CORS errors in the console.

If you see CORS issues:

- Make sure `flask-cors` is configured on the backend (see `02_backend_deploy_raindrop.md`).  
- Double-check that the frontend is using HTTPS and the exact backend URL.

---

## 4. Live URL for DevPost

The URL you will paste into the DevPost field **“Live Deployed App”** is the **HUD URL**, e.g.:

```text
https://citizen-hero-hud.netlify.app
```

That page should:

- Load in a fresh browser with no setup.  
- Allow the judge to generate at least one mission end-to-end.  
- Clearly show SGXP, checkboxes, and the core “Citizen Hero” experience from the video.

After this doc is implemented, the key missing requirement (public live URL) will be satisfied.
