# 05 – DevPost submission checklist

Goal: **Ensure the Citizen Hero submission can’t be disqualified on a technicality** and that the story matches reality.

Use this as a pre-flight checklist before hitting “Submit” on DevPost.

---

## 1. Live deployed app URL

- [ ] HUD is deployed as a static site (Netlify / Vercel / etc.).  
- [ ] URL opens in an incognito browser with **no setup**.  
- [ ] HUD successfully generates missions end-to-end using the Raindrop backend.  
- [ ] No obvious console errors or CORS issues.

**DevPost field:**  
- [ ] “Live Deployed App” → set to HUD URL, e.g. `https://citizen-hero-hud.netlify.app`.

---

## 2. Backend: Raindrop + Vultr integration

- [ ] Flask API is deployed on **Raindrop** via MCP / service manifest.  
- [ ] Environment variables are set in Raindrop:
  - [ ] `APP_ENV=production`
  - [ ] `RAINDROP_API_URL`
  - [ ] `RAINDROP_API_KEY`
  - [ ] `DATABASE_URL` (Vultr Managed Postgres / SmartSQL)
- [ ] Mission generation path actually calls **Raindrop SmartInference** (logs confirm).  
- [ ] Missions / SGXP data are stored in **Vultr Postgres** (you can see rows appearing).

In DevPost’s “Raindrop + Vultr services used” section, double-check that you accurately list:

- [ ] Raindrop SmartInference (and SmartMemory/SmartSQL if used).  
- [ ] Vultr Managed PostgreSQL (or the specific Vultr service backing SmartSQL).

---

## 3. Source code access

Pick one (or both):

- [ ] Public GitHub repo:
  - [ ] Repo is **public**.  
  - [ ] `LICENSE` file present (MIT).  
  - [ ] README explains how to run locally and where to find the live HUD.  

**OR**

- [ ] Full source zip upload:
  - [ ] Zip includes backend, frontend, docs, and not just built assets.  
  - [ ] License file is included at the root.

**DevPost field:**  
- [ ] “Code Repository” and/or “Source Files” point to the right place.

---

## 4. Demo video

- [ ] Video is **≤ 3 minutes**.  
- [ ] Hosted on YouTube, Vimeo, or other supported platform.  
- [ ] Shows the actual HUD → mission → SGXP flow, ideally using the live backend.  
- [ ] Mentions Raindrop + Vultr briefly when you talk about the architecture.

**DevPost field:**  
- [ ] “Demo Video” URL is set and publicly accessible.

---

## 5. Text description & feature list

In DevPost’s description fields:

- [ ] Short description clearly states what Citizen Hero does.  
- [ ] Long description / “What it does” explains:
  - Sci‑fi suit OS vibe.  
  - “I care → I did” mission flow.  
  - SGXP (Super Greatness Experience Points™) as the feedback loop.
- [ ] “How we built it” section calls out:
  - Browser HUD (frontend).  
  - Flask API on Raindrop.  
  - Raindrop SmartInference.  
  - Vultr Managed Postgres (or SmartSQL).

If asked about tooling / AI assistants:

- [ ] Honestly mention using Claude Code / Gemini CLI / other assistants for wiring Raindrop, plus any other helpful tools you used during development.

---

## 6. Final smoke test (judge’s perspective)

Pretend you are a judge with no context:

1. Click the **Live App URL** in DevPost.  
2. Try Citizen Hero for 1–2 minutes:
   - Generate a mission.  
   - Check off items on the mission checklist.  
   - Watch SGXP tally update.
3. Nothing should crash, hang, or lead to obvious “this isn’t deployed” issues.

If the experience is smooth and all checkboxes above are ticked, Citizen Hero should meet the written requirements and be judged on concept & execution—not tripped up by missing infrastructure pieces.
