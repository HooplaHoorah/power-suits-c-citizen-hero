import os
import requests
import re


def _make_operation_name(mission_idea: str) -> str:
    """
    Generate a short, punchy OPERATION-style quest name
    from the user's mission idea. Used only when RAINDROP
    SmartInference isn't available.

    This helper looks for common themes (animals, bullying,
    climate / environment, food drives, school, safety, etc.)
    and falls back to a generic OPERATION + 1–2 keyword name.
    """
    idea = (mission_idea or "").strip().lower()
    if not idea:
        return "OPERATION CITIZEN HERO"

    # Themed rules: if the mission mentions one of these topics,
    # return a hand-crafted codename.
    themed_rules = [
        # Animals / shelters / pets
        (
            [
                "cat",
                "cats",
                "kitten",
                "kittens",
                "dog",
                "dogs",
                "puppy",
                "puppies",
                "pet",
                "pets",
                "animal",
                "animals",
                "shelter",
                "rescue",
            ],
            "OPERATION COZY PAWS",
        ),
        # Bullying / inclusion / kindness
        (
            [
                "bully",
                "bullying",
                "bullied",
                "teased",
                "teasing",
                "left out",
                "excluded",
                "inclusion",
                "kindness",
                "mean at school",
                "picked on",
            ],
            "OPERATION KINDNESS SHIELD",
        ),
        # Food drive / hunger
        (
            [
                "hunger",
                "hungry",
                "food drive",
                "food bank",
                "food pantry",
                "pantry",
                "meals",
                "meal",
                "groceries",
                "soup kitchen",
                "lunch debt",
            ],
            "OPERATION FULL PLATES",
        ),
        # Environment / climate / recycling / clean-ups
        (
            [
                "climate",
                "climate change",
                "global warming",
                "planet",
                "earth",
                "environment",
                "pollution",
                "emissions",
                "carbon",
                "recycle",
                "recycling",
                "trash",
                "rubbish",
                "litter",
                "garbage",
                "waste",
                "plastic",
                "cleanup",
                "clean up",
                "clean-up",
                "park",
                "beach",
                "river",
            ],
            "OPERATION GREEN GUARDIANS",
        ),
        # Neighborhood safety / traffic
        (
            [
                "violence",
                "crime",
                "safe",
                "safety",
                "unsafe",
                "neighborhood watch",
                "crosswalk",
                "traffic",
                "speeding",
                "cars",
                "drivers",
            ],
            "OPERATION SAFE STREETS",
        ),
        # Books / tutoring / homework help
        (
            [
                "homework",
                "tutor",
                "tutoring",
                "study group",
                "reading",
                "literacy",
                "book",
                "books",
                "library",
            ],
            "OPERATION BRAIN BOOST",
        ),
        # School spirit / campus improvements
        (
            [
                "school",
                "class",
                "classroom",
                "teacher",
                "teachers",
                "students",
                "student",
                "principal",
                "campus",
            ],
            "OPERATION SCHOOL SPARK",
        ),
    ]

    for keywords, name in themed_rules:
        for keyword in keywords:
            if keyword in idea:
                return name

    # Fallback: derive a short codename from the text.
    # Strip out common stopwords and keep the first 1–2 content words.
    words = re.findall(r"[a-zA-Z']+", idea)
    stopwords = {
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "if",
        "then",
        "else",
        "when",
        "at",
        "on",
        "in",
        "near",
        "my",
        "our",
        "their",
        "his",
        "her",
        "for",
        "to",
        "from",
        "with",
        "about",
        "are",
        "is",
        "was",
        "were",
        "be",
        "been",
        "am",
        "there",
        "lots",
        "lot",
        "bunch",
        "of",
        "many",
        "really",
        "very",
        "so",
        "too",
        "just",
        "like",
        "that",
        "this",
        "those",
        "these",
        "over",
        "up",
        "down",
        "around",
        "also",
        "still",
        "into",
        "out",
        "by",
        "as",
        "your",
        "you",
        "me",
        "i",
        "we",
        "they",
        "them",
        "us",
        "he",
        "she",
        "it",
        "who",
        "what",
        "where",
        "why",
        "how",
        "which",
        "because",
        "than",
        "do",
        "does",
        "did",
        "doing",
        "can",
        "could",
        "should",
        "would",
        "will",
        "want",
        "dont",
        "don't",
        "know",
        "start",
        "need",
        "needs",
        "supplies",
        "make",
    }
    keywords = [w for w in words if w.lower() not in stopwords]
    if not keywords:
        return "OPERATION CITIZEN HERO"

    core = " ".join(w.upper() for w in keywords[:2])
    return f"OPERATION {core}"


def generate_quest(data):
    """
    Generate a quest based on the provided mission idea and help mode.

    Attempts to call a RAINDROP SmartInference endpoint if configured via
    environment variables. If the call fails or is not configured, falls
    back to a simple rule-based generator that personalises the mission
    while keeping a short, codename-style quest_name.
    """
    # Extract parameters from the incoming data dictionary
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
            # If the response is successful and looks like a quest, return it
            if response.ok:
                quest = response.json()
                if isinstance(quest, dict) and "quest_name" in quest and "steps" in quest:
                    return quest
        except Exception as e:
            # Print any exceptions for debugging and fall back to offline generator
            print(f"RAINDROP API error: {e}")

    # Offline fallback rule-based quest generation
    quest_name = _make_operation_name(mission_idea)

    # Determine summary and steps based on help mode
    if help_mode == "supplies":
        mission_summary = (
            "Gather essential supplies to support your mission: "
            f"{mission_idea}. Over the next two weeks, you'll rally friends, "
            "family, and neighbors to collect what's needed."
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
                    f"{mission_idea}. Make a list with your adult ally."
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
                    "Deliver the collected supplies to those affected by "
                    f"{mission_idea} and thank everyone who helped."
                ),
                "sgxp_reward": 30,
            },
        ]
    elif help_mode == "awareness":
        mission_summary = (
            f"Raise awareness about {mission_idea}. Over the next two weeks, "
            "you’ll learn, create messages, and share them widely."
        )
        steps = [
            {
                "id": 1,
                "title": "Learn about the issue",
                "description": (
                    "Read articles or watch videos to understand why "
                    f"{mission_idea} matters."
                ),
                "sgxp_reward": 10,
            },
            {
                "id": 2,
                "title": "Plan your message",
                "description": (
                    "With your adult ally, decide the key facts and stories you "
                    "want to share."
                ),
                "sgxp_reward": 15,
            },
            {
                "id": 3,
                "title": "Create awareness materials",
                "description": (
                    "Design posters, social media posts, or presentations to "
                    "spread the word."
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
            f"Organize helpers to tackle {mission_idea}. Over the next two weeks, "
            "you’ll recruit volunteers and coordinate their efforts."
        )
        steps = [
            {
                "id": 1,
                "title": "Identify tasks",
                "description": (
                    "List out what needs to be done to address "
                    f"{mission_idea}."
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
                    "With your team and adult ally, schedule when and where the "
                    "tasks will happen."
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
            f"Make a difference by acting on {mission_idea}. Over the next two "
            "weeks you'll create your own mission plan."
        )
        steps = [
            {
                "id": 1,
                "title": "Define your goal",
                "description": (
                    "With an adult ally, clarify what success looks like for "
                    f"{mission_idea}."
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
                    f"{mission_idea}."
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
            f"What surprised you while working on {mission_idea}?",
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
    """
    Generate clarifying questions to help refine the mission.
    """
    mission_idea = data.get("mission_idea", "").strip()
    help_mode = data.get("help_mode", "supplies")

    # Mock questions based on help mode
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
