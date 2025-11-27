# 11 Day Road Map for **Power Suits C – Citizen Hero**

**Goal:** deliver a polished vertical slice demonstrating the core “Citizen Hero” game loop (onboarding, idea capture, clarifying questions, AI‑generated quest, SGXP award and quest log) by the submission deadline in **11 days**.  This plan condenses the 13‑day North‑Star roadmap into a tighter schedule (11 days) and avoids feature creep by focusing on the minimum viable features identified in the concept and narrative docs【256564161777472†L45-L69】【823088950896859†L248-L322】.

## Day 1 – Kick‑off & scope lock
- **Review design docs:** Re‑read the vertical slice document and the GameLoop Tech Map to understand the narrative moments (login, hub, mission intake, planning, action scenes, debrief and meta‑progression)【426333952154943†L33-L351】.  Identify which steps must appear in the hackathon slice.
- **Define scope:** Decide that the vertical slice will include only onboarding, quest generation, SGXP tracking and a simple dashboard, avoiding MOBA‑style team battles or complex modules【823088950896859†L248-L322】.  Confirm that each quest has ≤ 5 steps, safety notes and reflection prompts【521181886595870†L8-L27】.
- **Set up environment:** Ensure the repository builds and that RAINDROP and Vultr credentials are accessible.  Assign responsibilities for backend, frontend, AI prompt and content, and marketing deliverables.

## Day 2 – Refine AI prompt & clarifying questions
- **Refine the Suit Brain prompt:** Start from `prompt.md` and incorporate clarifying questions so the AI can collect mission details (who, what, where, desired help mode) before generating the quest【256564161777472†L151-L173】.
- **Design conversation flow:** Draft the sequence of clarifying questions and responses for the vertical slice.  Keep the tone encouraging and use the JayNova persona described in the design docs to reinforce engagement【426333952154943†L33-L351】.
- **Update backend stub:** Modify `generate_quest.py` to handle clarifying question input and produce quests consistent with the refined prompt.  Keep fallback logic for offline use【147400256492191†L10-L84】.

## Day 3 – Integrate RAINDROP & Vultr
- **Connect SmartInference:** Replace the rule‑based fallback with actual calls to RAINDROP’s SmartInference to generate quests, as described in the docs【365910690921149†L4-L41】.  Securely store API keys and test with sample prompts.
- **Persist quests:** Use Vultr’s SmartSQL or the existing PostgreSQL/SQLite layer to save quest JSON and SGXP results.  Implement endpoints for retrieving all quests and single quests (if not already done) and test them【763621770356766†L14-L90】.
- **End‑to‑end test:** Send a full idea capture through the clarifying questions, get a quest back and save it to the log.  Validate that the quest JSON fields (name, mission summary, difficulty, steps with SGXP rewards, reflection prompts, safety notes) match the required structure【521181886595870†L8-L27】.

## Day 4 – Frontend UI enhancements
- **Improve onboarding screen:** Polish the call‑sign, age range, mission idea and help‑mode inputs in `frontend/index.html`.  Add explanatory copy and a progress indicator so users know they’re in the planning phase.
- **Display SGXP and quest details:** After quest generation, show the quest name, mission summary, list of steps with SGXP rewards, reflection prompts and safety notes in a structured card or panel.  Include an SGXP progress bar reflecting the total SGXP earned in the session.
- **Ensure responsiveness:** Use simple CSS or a lightweight framework to make the page readable on desktop and mobile.  Avoid heavy styling or extra modules; focus on clarity and polish.

## Day 5 – Quest log & persistence
- **Quest log UI:** Add a section to the frontend where users can view their saved quests.  Provide a button (“View suit log”) to switch between the quest form and the saved quests list.
- **Backend endpoints:** Use or extend the `/quests` and `/quests/<id>` routes to fetch quest histories and individual quests【763621770356766†L14-L90】.  Ensure that new quests are automatically logged after creation.
- **SGXP accumulation:** Show the cumulative SGXP for the user across quests.  Keep the implementation simple (per‑session accumulation) rather than persistent accounts to avoid scope creep.

## Day 6 – Narrative & polish
- **Voice and persona:** Integrate the JayNova persona or Suit OS “voice” into on‑screen text, drawing from the narrative docs.  Ensure instructions and encouragement align with the empathetic, empowering tone envisioned in the concept【426333952154943†L33-L351】.
- **Safety and reflection:** Include the safety notes and reflection prompts in the UI and emphasize the need to involve a trusted adult if the user is under 18【521181886595870†L8-L27】.
- **Refine error handling:** Provide clear messages if RAINDROP fails or if inputs are invalid.  Keep fallback generation in place but indicate when the AI used offline logic.

## Day 7 – Testing & bug fixes
- **Unit tests:** Write simple tests (using pytest or JavaScript tests) for the quest generator, API routes and UI components.
- **Integration testing:** Run through multiple user flows with different ages, help modes and problems.  Fix any bugs or UX issues discovered.
- **Performance tuning:** Check loading times and optimize any inefficient calls.  Ensure the app works on low‑bandwidth connections.

## Day 8 – Demo script & narrative flow
- **Write the demo script:** Draft a concise (2–3 minute) script covering the problem, solution and user journey.  Use the “Episode: JayNova’s First Quest” as inspiration for the storyline【256564161777472†L151-L173】.
- **Storyboarding:** Plan the sequence of shots for the video – introduction, user entering details, AI clarifying, quest generation, SGXP award and closing call‑to‑action.  Identify which parts will show the live prototype and which will be narration or slides.
- **Peer review:** Share the script with teammates for feedback and adjust based on suggestions.

## Day 9 – Slide deck & visuals
- **Structure slides:** Create a slide deck that matches the hackathon judging criteria: problem statement, vision & innovation, how it works (architecture diagram), user journey, and future potential【256564161777472†L118-L139】.  Use images from the tech map or draw simple diagrams.
- **Include metrics & impact:** Highlight why the project matters (e.g., empowering kids to solve community problems, safe and supervised civic quests).  Keep text brief; rely on visuals and bullet points.
- **Design consistency:** Match the visual style of the slides to the UI of the prototype.  Use the project’s colour palette and fonts where possible.

## Day 10 – Record & edit the demo video
- **Record prototype walkthrough:** Capture the screen using a recorder (OBS, Loom or similar) while narrating the user journey.  Demonstrate a user inputting a problem, answering clarifying questions and receiving a quest with SGXP rewards.
- **Integrate slides and narration:** Combine screen captures with slides and voice‑over, ensuring the pacing aligns with the script.  Keep the video within the time limit.
- **Finalize editing:** Add captions or annotations for clarity, adjust audio levels and include royalty‑free music if desired.  Export to the required format.

## Day 11 – Final QA & submission
- **Quality assurance:** Run the prototype end‑to‑end multiple times.  Fix any remaining bugs and ensure the UI and narrative flow are polished.
- **Documentation:** Update `README.md` and create or refine other docs (e.g., `docs/how-it-works.md`) to reflect the final architecture and user journey.  Add instructions for running the prototype locally.
- **DevPost submission:** Prepare the DevPost entry: copy the final description, upload the video, include slides and repository link, and answer all submission questions.  Double‑check that there is no feature creep—stay focused on the core slice.
- **Push final changes:** Commit and push all code and documentation to the repository.  Tag the release if desired.  Celebrate!
