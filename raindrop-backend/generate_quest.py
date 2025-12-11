import os
from typing import Any, Dict

# NOTE: This version is fully offline (no RAINDROP calls).
# It always produces a short 'OPERATION ...' codename, based on themes,
# and NEVER reuses the raw mission text for the operation title.


# ---------------------------------------------------------------------------
# Operation codename helpers
# ---------------------------------------------------------------------------

def _select_codename(mission_idea: str) -> str:
    """Pick a short codename based on loose keywords in the mission idea.

    Mapping:
      - Cats / small pets / strays      -> COMFY PAWS
      - Dogs                            -> BRAVE PAWS
      - Plants / gardens / trees        -> GREEN ROOTS
      - Trash / litter / recycling      -> CLEAN SWEEP
      - Climate / planet / environment  -> GREEN GUARDIANS
      - Bullying / inclusion / kindness -> KINDNESS SHIELD
      - Hunger / food drives            -> FULL PLATES
      - Homelessness / shelters         -> SAFE HAVEN
      - School / classroom / campus     -> SCHOOL SPARK
      - Books / reading / libraries     -> STORY SPARK
      - Safety / traffic / danger       -> SAFE STREETS
      - Loneliness / belonging          -> BRIGHT SMILES
      - Anything else                   -> CITIZEN HERO
    """
    text = (mission_idea or "").lower()

    categories = [
        # Animals: cats / small pets / strays
        (
            [
                "cat",
                "cats",
                "kitten",
                "kittens",
                "stray",
                "strays",
                "pet",
                "pets",
                "animal shelter",
                "shelter animals",
            ],
            "COMFY PAWS",
        ),
        # Animals: dogs
        (
            [
                "dog",
                "dogs",
                "puppy",
                "puppies",
            ],
            "BRAVE PAWS",
        ),
        # Plants / gardens / trees
        (
            [
                "plant",
                "plants",
                "garden",
                "gardens",
                "yard",
                "weeds",
                "weed",
                "forest",
                "trees",
                "tree",
                "flowers",
                "flower",
                "bush",
                "bushes",
                "grass",
                "overgrown",
            ],
            "GREEN ROOTS",
        ),
        # Trash / litter / recycling / pollution
        (
            [
                "trash",
                "litter",
                "garbage",
                "rubbish",
                "recycle",
                "recycling",
                "pollution",
                "plastic",
                "waste",
                "landfill",
                "dump",
            ],
            "CLEAN SWEEP",
        ),
        # Climate / planet / environment
        (
            [
                "climate",
                "climate change",
                "global warming",
                "environment",
                "planet",
                "earth",
                "emissions",
                "carbon",
                "ice caps",
                "polar",
                "heat wave",
            ],
            "GREEN GUARDIANS",
        ),
        # Bullying / kindness / inclusion
        (
            [
                "bully",
                "bullying",
                "bullied",
                "mean kids",
                "teased",
                "teasing",
                "left out",
                "excluded",
                "unkind",
                "kindness",
                "inclusion",
                "inclusive",
                "respect",
            ],
            "KINDNESS SHIELD",
        ),
        # Hunger / food / lunches / food drives
        (
            [
                "hunger",
                "hungry",
                "food drive",
                "food bank",
                "food pantry",
                "pantry",
                "lunch debt",
                "meals",
                "meal",
                "groceries",
                "school lunches",
                "school lunch",
                "lunch",
                "lunches",
            ],
            "FULL PLATES",
        ),
        # Homelessness / housing / shelters
        (
            [
                "homeless",
                "homelessness",
                "no home",
                "no housing",
                "unstable housing",
                "shelter",
                "shelters",
            ],
            "SAFE HAVEN",
        ),
        # School / classroom / campus
        (
            [
                "school",
                "schools",
                "class",
                "classroom",
                "teacher",
                "teachers",
                "students",
                "student",
                "principal",
                "campus",
                "hallway",
                "locker",
                "illiteracy",
                "homework",
            ],
            "SCHOOL SPARK",
        ),
        # Books / reading / libraries
        (
            [
                "library",
                "libraries",
                "book",
                "books",
                "reading",
                "read more",
                "literacy",
            ],
            "STORY SPARK",
        ),
        # Safety / traffic / danger
        (
            [
                "safety",
                "unsafe",
                "dangerous",
                "violence",
                "crime",
                "traffic",
                "crosswalk",
                "speeding",
                "cars",
                "drivers",
                "street light",
                "stop sign",
                "danger",
            ],
            "SAFE STREETS",
        ),
        # Loneliness / belonging / friendship
        (
            [
                "lonely",
                "alone",
                "isolated",
                "no friends",
                "shy kids",
                "new kid",
                "friendship",
                "belong",
                "belonging",
            ],
            "BRIGHT SMILES",
        ),
    ]

    for keywords, codename in categories:
        for kw in keywords:
            if kw in text:
                return codename

    # Neutral default if nothing matches
    return "CITIZEN HERO"


def _build_operation_name(mission_idea: str) -> str:
    """Return an 'OPERATION ...' name based on the mission idea."""
    codename = _select_codename(mission_idea)
    return f"OPERATION {codename}"


# ---------------------------------------------------------------------------
# Quest generation
# ---------------------------------------------------------------------------

def generate_quest(data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a quest payload for the frontend.

    This offline generator:
    - Always uses a short 'OPERATION ...' codename that does NOT echo the full
      problem paragraph.
    - Tailors mission_summary and steps based on help_mode.
    """
    mission_idea = (data.get("mission_idea") or "").strip()
    help_mode = data.get("help_mode", "supplies") or "supplies"

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

    quest: Dict[str, Any] = {
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


def generate_clarifying_questions(data: Dict[str, Any]):
    """Generate clarifying questions to help refine the mission."""
    mission_idea = (data.get("mission_idea") or "").strip()
    help_mode = data.get("help_mode", "supplies") or "supplies"

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

    if mission_idea and len(mission_idea.split()) < 6:
        questions.append("Can you add one more detail about why this matters to you?")

    return questions
