# Day 3 – Integrate RAINDROP & Vultr

This document summarises the changes implemented for **Day 3** of the
11‑day roadmap.  The goal of this phase is to replace the simple
rule‑based quest generator with a call to Raindrop’s SmartInference
service and to prepare for persistence via Vultr’s SmartSQL
database.  Where possible, these changes are backwards compatible so
that the application continues to run locally without external
dependencies.

## Enhanced quest generator

The new module `raindrop-backend/generate_quest_day3.py` contains an
updated `generate_quest` function that:

1. Accepts the clarifying parameters collected on Day 2 (``who``,
   ``where`` and ``outcome``) in addition to the existing
   ``mission_idea`` and ``help_mode``.
2. Attempts to call a Raindrop **SmartInference** endpoint when the
   environment variables `RAINDROP_API_URL` and `RAINDROP_API_KEY` are
   defined.  The payload includes all clarifying fields.  If the
   request succeeds and returns a JSON object with the expected keys
   (``quest_name`` and ``steps``), that response is returned to the
   caller.  Otherwise, the code falls back to a rule‑based generator.
3. Personalises the fallback quest using the clarifying details.  If
   ``who``, ``where`` and ``outcome`` are provided, it crafts a
   mission summary like “Help <who> by <outcome> in <where>.” and
   derives a simple operation name.  If no clarifying details are
   present, it falls back to the default “Operation Cozy Paws”
   example.
4. Maintains the same overall JSON structure (quest name, mission
   summary, difficulty, duration, steps, reflection prompts and safety
   notes) so that the front‑end continues to work without modification.

## API integration

To enable SmartInference calls in your environment:

1. Obtain a **SmartInference** endpoint URL and bearer token from
   Raindrop.  These should be provided by the platform once your
   application is configured.
2. Set the following environment variables when running the backend:

       export RAINDROP_API_URL="https://api.raindrop.ai/smartinference/your-endpoint"
       export RAINDROP_API_KEY="your-bearer-token"

3. Import the new generator in `raindrop-backend/app.py` by
   replacing the existing import line.  For example:

       # from generate_quest import generate_quest
       from generate_quest_day3 import generate_quest

   You may wrap this in a try/except to preserve compatibility if the
   new module is not present.

With these variables set, the backend will call SmartInference and
return the generated quest to the front‑end.  If the variables are
unset or the call fails, the user still receives a reasonable quest.

## Persistence with Vultr SmartSQL

The existing Flask backend uses a local SQLite database (`quests.db`)
to persist quest JSON.  For the vertical slice this is sufficient,
but the roadmap calls for migrating to Vultr’s **SmartSQL** (managed
PostgreSQL).  To prepare for this migration:

1. Create a PostgreSQL database via Vultr and obtain the
   connection string.  This will look similar to
   `postgresql://<user>:<password>@<host>:<port>/<database>`.
2. Set a `DATABASE_URL` environment variable with this string.
3. Update `raindrop-backend/app.py` to detect `DATABASE_URL` and use
   a PostgreSQL driver (e.g., ``psycopg2`` or ``sqlalchemy``) to
   connect to PostgreSQL instead of SQLite.  If `DATABASE_URL` is not
   defined, fall back to the existing SQLite implementation.  This
   ensures the app remains operational in development environments
   without external services.

Because adding PostgreSQL dependencies and migration scripts requires
additional setup, those changes are left for future days in the
roadmap.  The Day 3 deliverable focuses on SmartInference integration
while keeping the persistence layer stable.

## Next steps

After integrating SmartInference and preparing the backend for
SmartSQL, the next phases of the roadmap will involve front‑end
polishing, quest log UI, narrative enhancements, comprehensive
testing, and final demo preparation.  See `docs/11-day-roadmap.md`
for the full schedule.
