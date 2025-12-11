import os
import re
from typing import Any, Dict

import requests


# Simple keyword → codename mapping for kid-friendly missions
_KEYWORD_CODENAMES = {
    "cat": "COZY PAWS",
    "cats": "COZY PAWS",
    "kitten": "COZY PAWS",
    "kittens": "COZY PAWS",
    "animal": "COZY PAWS",
    "animals": "COZY PAWS",
    "shelter": "COZY PAWS",
    "dog": "BRAVE TAILS",
    "dogs": "BRAVE TAILS",
    "trash": "CLEAN STREETS",
    "litter": "CLEAN STREETS",
    "garbage": "CLEAN STREETS",
    "recycle": "GREEN CYCLE",
    "recycling": "GREEN CYCLE",
    "park": "GREEN ROOTS",
    "parks": "GREEN ROOTS",
    "tree": "GREEN ROOTS",
    "trees": "GREEN ROOTS",
    "bully": "KINDNESS SHIELD",
    "bullying": "KINDNESS SHIELD",
    "hunger": "FULL PLATES",
    "hungry": "FULL PLATES",
    "food": "FULL PLATES",
    "homeless": "SAFE HAVEN",
    "homelessness": "SAFE HAVEN",
    "library": "STORY SPARK",
    "libraries": "STORY SPARK",
}

_STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "for", "of", "in", "on", "at", "to",
    "from", "with", "about", "there", "are", "is", "was", "were", "be", "being",
    "been", "have", "has", "had", "do", "does", "did", "so", "that", "this",
    "these", "those", "just", "really", "very", "bunch", "lot", "lots",
}


def _generate_operation_codename(mission_idea: str) -> str:
    """Derive a short "OPERATION ..." codename from the mission idea.

    Rules (in order):
    1. If a known keyword appears (cats, litter, bullying, etc.), use its mapped codename.
    2. Otherwise, strip punctuation, drop common stopwords, and take the first 1–2
       meaningful words as the codename.
    3. If nothing useful is found, fall back to "CITIZEN HERO".
    """
    if not mission_idea:
        return "OPERATION CITIZEN HERO"

    text = mission_idea.lower()

    # 1) Keyword-based special cases
    for keyword, codename in _KEYWORD_CODENAMES.items():
        if keyword in text:
            return f"OPERATION {codename}"

    # 2) Generic fallback: first 1–2 non-stopwords
    cleaned = re.sub(r"[^a-z0-9\s]", " ", text)
    tokens = [t for t in cleaned.split() if t and t not in _STOPWORDS]

    if tokens:
        codename_words = [w.upper() for w in tokens[:2]]
        return "OPERATION " + " ".join(codename_words)

    # 3) Final safety net
    return "OPERATION CITIZEN HERO"


def generate_quest(data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a quest based on the provided mission idea and help mode.

    - Tries a RAINDROP SmartInference endpoint if configured via env vars.
    - Always enforces a short, codename-style quest_name derived from mission_idea,
      so it never mirrors the full "What's bugging you" paragraph.
    - Falls back to a rule-based template when RAINDROP is unavailable.
    """
    mission_idea = (data.get("mission_idea") or "").strip()
    help_mode = data.get("help_mode", "supplies")

    # Attempt to call a RAINDROP SmartInference endpoint
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
                # Make sure we always have a nice codename, even if the model
                # echoes the full mission_idea back as the quest name.
                if isinstance(quest, dict):
                    quest_name = _generate_operation_codename(mission_idea or quest.get("mission_summary", ""))
                    quest["quest_name"] = quest_name
                    quest.setdefault("help_mode", help_mode)
                    return quest
        except Exception as e:  # pragma: no cover - network issues
            # Print any exceptions for debugging and fall back to local generation.
            print(f"RAINDROP API error: {e}")

    # Dynamic fallback rule-based quest generation
    quest_name = _generate_operation_codename(mission_idea)

    if help_mode == "supplies":
        mission_summary = (
            "Gather essential supplies to support your mission. Over the next two weeks, "
            "you'll rally friends, family, and neighbors to collect what's needed."
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
                    "Identify the types of supplies needed to address your mission. "
                    "Make a list with your adult ally."
                ),
                "sgxp_reward": 15,
            },
            {
                "id": 3,
                "title": "Spread the word",
                "description": (
                    "Create flyers or social media posts asking for donations and "
                    "explaining why they matter."
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
                    "Deliver the collected supplies to those affected by your mission "
                    "and thank everyone who helped."
                ),
                "sgxp_reward": 30,
            },
        ]
    elif help_mode == "awareness":
        mission_summary = (
            "Raise awareness about an issue you care about. Over the next two weeks, "
            "you’ll learn, create messages, and share them widely."
        )
        steps = [
            {
                "id": 1,
                "title": "Learn about the issue",
                "description": (
                    "Read articles or watch videos to understand why this mission matters."
                ),
                "sgxp_reward": 10,
            },
            {
                "id": 2,
                "title": "Plan your message",
                "description": (
                    "With your adult ally, decide the key facts and stories you want to share."
                ),
                "sgxp_reward": 15,
            },
            {
                "id": 3,
                "title": "Create awareness materials",
                "description": (
                    "Design posters, social media posts, or presentations to spread the word."
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
                    "Talk to peers about what they learned and how they feel about the mission."
                ),
                "sgxp_reward": 30,
            },
        ]
    elif help_mode == "helpers":
        mission_summary = (
            "Organize helpers to tackle your mission. Over the next two weeks, you’ll "
            "recruit volunteers and coordinate their efforts."
        )
        steps = [
            {
                "id": 1,
                "title": "Identify tasks",
                "description": "List out what needs to be done to make an impact.",
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
                    "With your team and adult ally, schedule when and where the tasks will happen."
                ),
                "sgxp_reward": 20,
            },
            {
                "id": 4,
                "title": "Take action together",
                "description": "Lead your team as you carry out the tasks to make a difference.",
                "sgxp_reward": 25,
            },
            {
                "id": 5,
                "title": "Reflect and celebrate",
                "description": "Thank your helpers and discuss what you accomplished together.",
                "sgxp_reward": 30,
            },
        ]
    else:
        mission_summary = (
            "Make a difference by acting on your mission idea. Over the next two weeks "
            "you'll create your own mission plan."
        )
        steps = [
            {
                "id": 1,
                "title": "Define your goal",
                "description": (
                    "With an adult ally, clarify what success looks like for your mission."
                ),
                "sgxp_reward": 10,
            },
            {
                "id": 2,
                "title": "Plan your approach",
                "description": (
                    "Decide whether you need supplies, awareness, or helpers and plan accordingly."
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
                    "Tell others what you learned and how they can help with your mission."
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
            "What surprised you while working on this mission?",
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
    help_mode = data.get("help_mode", "supplies")

    questions = [
        "Who is the specific beneficiary of this mission?",
        "What is your timeline for completing this?",
    ]

    if help_mode == "supplies":
        questions.append("What kind of supplies are most needed?")
    elif help_mode == "awareness":
        questions.append("Who is your target audience for raising awareness?")
    elif help_mode == "helpers":
        questions.append("How many helpers do you think you need?")

    return questions
