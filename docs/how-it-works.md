# How It Works

Citizen Hero is a minimal web app built on the Raindrop platform with Vultr-managed PostgreSQL.

## User Flow

1. **Idea capture** – On the front page, the user enters:
   - a nickname or alias,
   - their age range,
   - a description of a problem they care about,
   - and selects whether they want to raise supplies, raise awareness, or organize helpers.
2. **AI generation** – When the user clicks “Boot Suit,” the front-end sends this data to the `/generate-quest` endpoint.
3. **Quest creation** – The backend uses Raindrop's SmartInference to call an LLM with a detailed prompt (`prompt.md`). It returns a JSON structure containing:
   - a quest name,
   - a one-sentence mission summary,
   - a difficulty label,
   - 3–5 steps with SGXP rewards,
   - reflection prompts,
   - and safety notes.
4. **Persistence** – The quest, along with the original idea and user session ID, is stored in a Vultr-managed PostgreSQL database via SmartSQL.
5. **Presentation** – The front-end displays the quest in a HUD-styled “Mission Brief,” showing the mission summary, steps with SGXP rewards, and any reflection or safety notes.
6. **Logging** – Users can save their quest to a “Suit Log,” which shows past quests by querying the database.

## Components

- **Raindrop SmartInference** – Handles the LLM call based on `prompt.md`.
- **Raindrop SmartSQL** – Binds the app to a Vultr-managed PostgreSQL database for storing user sessions and quest data.
- **Flask backend** – Defines the `/generate-quest` endpoint and inserts quest data into the database.
- **Static front-end** – A simple HTML/JS UI for capturing inputs and showing the quest output.

## Data Model (PostgreSQL)

- **quests** table:
  - `id` (UUID)
  - `session_id` (text)
  - `nickname` (text)
  - `age_range` (text)
  - `idea` (text)
  - `help_mode` (text)
  - `quest_json` (JSON)
  - `created_at` (timestamp)

The front-end only reads and writes through the API, keeping the database secure and hidden from the browser.
