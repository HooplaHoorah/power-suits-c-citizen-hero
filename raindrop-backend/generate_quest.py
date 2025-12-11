
import os
import re
import requests


# Common filler words to ignore when building short codenames
STOPWORDS = {
    "a", "an", "the", "and", "or", "for", "of", "on", "in", "at", "to", "with",
    "about", "around", "near", "my", "our", "their", "your", "this", "that",
    "these", "those", "is", "are", "be", "being", "been", "there", "lots",
    "bunch", "many", "very", "really", "just", "some"
}


def _clean_phrase(text: str) -> str:
    """Trim whitespace and outer quotes from a phrase."""
    t = (text or "").strip()
    if len(t) >= 2 and t[0] in "\"'“”‘" and t[-1] in "\"'“”’":
        t = t[1:-1].strip()
    return t


def _extract_core_topic(text: str) -> str:
    """Derive a short, thematic phrase from the user's mission idea."""
    if not text:
        return "CITIZEN HERO"

    # Remove wrapping quotes and trim to the first sentence when needed
    t = _clean_phrase(text)
    for sep in [".", "!", "?"]:
        if sep in t:
            t = t.split(sep, 1)[0]
            break
    t = t.strip()
    if not t:
        return "CITIZEN HERO"

    lower = t.lower()

    # A few hand-tuned themed shortcuts for common mission types
    if any(word in lower for word in ("cat", "cats", "kitten", "kittens")):
        # Matches the original cozy‑paws sample vibe but with your copy tweak
        return "COMFY PAWS"
    if any(word in lower for word in ("dog", "dogs", "puppy", "puppies")):
        return "BRAVE PAWS"
    if any(word in lower for word in ("animal shelter", "shelter animals")):
        return "COZY PAWS"
    if any(word in lower for word in ("trash", "litter", "garbage", "rubbish", "pollution")):
        return "CLEAN SWEEP"
    if any(word in lower for word in ("bully", "bullying", "kindness", "inclusion")):
        return "KINDNESS SHIELD"

    # Generic path: take up to two meaningful words (no stopwords) and uppercase them.
    tokens = re.findall(r"[A-Za-z']+", t)
    words = [w for w in tokens if w.lower() not in STOPWORDS]
    if not words:
        words = tokens or ["Hero", "Mission"]

    core = " ".join(words[:2]).upper()
    return core


def _is_reasonable_codename(name: str) -> bool:
    """Return True if the given name already looks like a short codename."""
    if not name:
        return False
    stripped = name.strip()
    # Reject if it is very long or obviously a full sentence with punctuation.
    if len(stripped) > 40:
        return False
    if any(p in stripped for p in ".?!,;:"):
        return False
    return True


def _build_operation_name(mission_idea: str, existing: str = "") -> str:
    """Normalise quest names into an 'OPERATION ...' codename.

    - If an existing quest_name from Raindrop already looks short and punchy,
      we keep it but normalise casing and prefix.
    - Otherwise we derive a compact codename from the mission_idea text.
    """
    if _is_reasonable_codename(existing):
        base = (existing or "").upper()
    else:
        base = _extract_core_topic(mission_idea)

    if not base.startswith("OPERATION "):
        return f"OPERATION {base}"
    return base


def generate_quest(data):
    """Generate a quest based on the provided mission idea and help mode.

    The function first attempts to call a Raindrop SmartInference endpoint
    if configured via RAINDROP_API_URL/RAINDROP_API_KEY. Whether or not that
    succeeds, we ensure the returned quest_name is a short 'OPERATION ...'
    codename instead of echoing the full problem paragraph.
    """
    # Extract parameters from the incoming data dictionary
    mission_idea = (data.get("mission_idea") or "").strip()
    help_mode = data.get("help_mode", "supplies")

    # Attempt to call a Raindrop SmartInference endpoint
    api_url = os.getenv("RAINDROP_API_URL")
    api_key = os.getenv("RAINDROP_API_KEY")
    if api_url and api_key:
        try:
            payload = {
                "mission_idea": mission_idea,
                "help_mode": help_mode,
            }
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            }
            response = requests.post(api_url, json=payload, headers=headers, timeout=15)
            if response.ok:
                quest = response.json()
                if isinstance(quest, dict) and "steps" in quest:
                    existing_name = (quest.get("quest_name") or "").strip()
                    mission_for_name = mission_idea or quest.get("mission_summary", "")
                    quest["quest_name"] = _build_operation_name(mission_for_name, existing_name)
                    return quest
        except Exception as exc:  # pragma: no cover - safety net
            # Log the error and fall through to offline generation
            print(f"RAINDROP API error: {exc}")

    # Offline dynamic fallback: build a quest using local templates and
    # the same Operation codename rules.
    quest_name = _build_operation_name(mission_idea)

    if help_mode == "supplies":
        mission_summary = (
            f"Gather essential supplies to support your mission: "
            f"{mission_idea or 'your chosen cause'}. "
            "Over the next two weeks, you'll rally friends, family, and neighbors "
            "to collect what's needed."
        )
        steps = [
            {
                "id": 1,
                "title": "Find your adult ally",
                "description": "Ask a trusted adult to help plan your supply drive.",
                "sgxp_reward": 10,
            },
            {
                "id": 2,
                "title": "Research what’s needed",
                "description": (
                    "Identify the types of supplies needed to address "
                    f"{mission_idea or 'your mission'}. Make a list with your adult ally."
                ),
                "sgxp_reward": 15,
            },
            {
                "id": 3,
                "title": "Spread the word",
                "description": (
                    "Create flyers or social media posts asking for donations "
                    "and explaining why they matter."
                ),
                "sgxp_reward": 20,
            },
            {
                "id": 4,
                "title": "Collect and organize supplies",
                "description": "Gather the supplies from donors and sort them by type.",
                "sgxp_reward": 25,
            },
            {
                "id": 5,
                "title": "Deliver and celebrate",
                "description": (
                    "Deliver the collected supplies to those affected by "
                    f"{mission_idea or 'your mission'} and thank everyone who helped."
                ),
                "sgxp_reward": 30,
            },
        ]
    elif help_mode == "awareness":
        mission_summary = (
            f"Raise awareness about {mission_idea or 'an issue you care about'}. "
            "Over the next two weeks, you’ll learn, create messages, and share them widely."
        )
        steps = [
            {
                "id": 1,
                "title": "Learn about the issue",
                "description": (
                    "Read articles or watch videos to understand why "
                    f"{mission_idea or 'this issue'} matters."
                ),
                "sgxp_reward": 10,
            },
            {
                "id": 2,
                "title": "Plan your message",
                "description": (
                    "With your adult ally, decide the key facts and stories "
                    "you want to share."
                ),
                "sgxp_reward": 15,
            },
            {
                "id": 3,
                "title": "Create awareness materials",
                "description": (
                    "Design posters, social media posts, or presentations "
                    "to spread the word."
                ),
                "sgxp_reward": 20,
            },
            {
                "id": 4,
                "title": "Share your message",
                "description": (
                    "Present your materials at school, community centers, or online."
                ),
                "sgxp_reward": 25,
            },
            {
                "id": 5,
                "title": "Gather feedback",
                "description": (
                    "Talk to peers about what they learned and how they feel "
                    "about the mission."
                ),
                "sgxp_reward": 30,
            },
        ]
    elif help_mode == "helpers":
        mission_summary = (
            f"Organize helpers to tackle {mission_idea or 'your mission'}. "
            "Over the next two weeks, you’ll recruit volunteers and coordinate their efforts."
        )
        steps = [
            {
                "id": 1,
                "title": "Identify tasks",
                "description": (
                    "List out what needs to be done to address "
                    f"{mission_idea or 'your mission'}."
                ),
                "sgxp_reward": 10,
            },
            {
                "id": 2,
                "title": "Recruit helpers",
                "description": (
                    "Ask friends, classmates, and community members to join your mission."
                ),
                "sgxp_reward": 15,
            },
            {
                "id": 3,
                "title": "Plan the work",
                "description": (
                    "With your team and adult ally, schedule when and where the tasks "
                    "will happen."
                ),
                "sgxp_reward": 20,
            },
            {
                "id": 4,
                "title": "Take action together",
                "description": (
                    "Lead your team as you carry out the tasks to make a difference."
                ),
                "sgxp_reward": 25,
            },
            {
                "id": 5,
                "title": "Reflect and celebrate",
                "description": (
                    "Thank your helpers and discuss what you accomplished together."
                ),
                "sgxp_reward": 30,
            },
        ]
    else:
        mission_summary = (
            f"Make a difference by acting on {mission_idea or 'your mission idea'}. "
            "Over the next two weeks you'll create your own mission plan."
        )
        steps = [
            {
                "id": 1,
                "title": "Define your goal",
                "description": (
                    "With an adult ally, clarify what success looks like for "
                    f"{mission_idea or 'this mission'}."
                ),
                "sgxp_reward": 10,
            },
            {
                "id": 2,
                "title": "Plan your approach",
                "description": (
                    "Decide whether you need supplies, awareness, or helpers "
                    "and plan accordingly."
                ),
                "sgxp_reward": 15,
            },
            {
                "id": 3,
                "title": "Execute your plan",
                "description": "Follow through with your actions, adjusting as needed.",
                "sgxp_reward": 20,
            },
            {
                "id": 4,
                "title": "Document your journey",
                "description": "Take notes or photos to capture your experience.",
                "sgxp_reward": 25,
            },
            {
                "id": 5,
                "title": "Share your impact",
                "description": (
                    "Tell others what you learned and how they can help with "
                    f"{mission_idea or 'this mission'}."
                ),
                "sgxp_reward": 30,
            },
        ]

    quest = {
        "quest_name": quest_name,
        "mission_summary": mission_summary,
        "difficulty": "Medium",
        "estimated_duration_days": 14,
        "help_mode": help_mode,
        "steps": steps,
        "reflection_prompts": [
            f"What surprised you while working on {mission_idea or 'this mission'}?",
            "How did teamwork or community support influence your mission?",
            "What would you do differently next time?",
        ],
        "safety_notes": [
            "Always involve a trusted adult when planning and carrying out your mission.",
            "Respect privacy and seek permission when taking photos or sharing stories.",
        ],
    }

    return quest


def generate_clarifying_questions(data):
    """Generate clarifying questions to help refine the mission."""
    mission_idea = (data.get("mission_idea") or "").strip()
    help_mode = data.get("help_mode", "supplies")

    # Core questions work for any mission
    questions = [
        "Who is the specific beneficiary of this mission?",
        "What is your timeline for completing this?",
    ]

    # Tailor one extra question based on help mode
    if help_mode == "supplies":
        questions.append("What kind of supplies are most needed?")
    elif help_mode == "awareness":
        questions.append("Who is your target audience for raising awareness?")
    elif help_mode == "helpers":
        questions.append("How many helpers do you think you need?")

    # If the mission idea is extremely short, nudge the player to expand it a bit.
    if mission_idea and len(mission_idea.split()) < 6:
        questions.append("Can you add one more detail about why this matters to you?")

    return questions
