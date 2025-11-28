# Power Suits C: Citizen Hero

**Power Suits C: Citizen Hero** is a Raindrop + Vultr powered web app that turns everyday problems into real-world **Hero Quests**.

Users type in something that’s bugging them in their world, choose how they want to help (raise supplies, raise awareness, or organize helpers), and the Suit Brain generates:

- A quest name and mission summary  
- 3–5 concrete steps
- SGXP (Super Greatness XP) rewards for each step  
- Reflection prompts and safety notes

For the AI Champion Ship hackathon, this repo contains:

- `frontend/` – single-page web UI for idea intake and quest HUD  
- `raindrop-backend/` – Raindrop app configuration and API handlers  
- `docs/` – architecture diagrams, prompts, and hackathon notes  

## Tech Stack (planned)

- **Frontend:** HTML/JS (or React), deployed as a static site  
- **Backend:** Raindrop Platform
  - SmartInference – Suit Brain prompt chain
  - SmartSQL / SmartMemory – quest storage & retrieval
- **Infra:** Vultr Managed PostgreSQL

## Hackathon Notes

This project is built for the **AI Champion Ship** hackathon on Devpost.

- Tracks: Public Good, Solopreneur  
- Status: Early prototype – focused on the “idea → quest” loop.


## SmartInference Integration (Optional)

Citizen Hero includes a pluggable quest engine that can be upgraded from the built-in rule-based generator to the Raindrop SmartInference API. By default, the app runs entirely locally, using a templated quest generato~~~
```
RAINDROP_API_URL=<your-raindrop-endpoint>
RAINDROP_API_KEY=<your-secret-api-key>
```
When both environment variables are present at runtime, the backend automatically sends your mission idea and clarifying details to Raindrop's SmartInference endpoint. The response is used to generate richer, more varied quests. Leaving these variables unset keeps all generation local and avoids any external API calls or billing. **Do not commit your API keys**.
