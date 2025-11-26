def generate_quest(data):
    # This is a stub generator for demonstration; in production, integrate with RAINDROP SmartInference or an LLM.
    mission_idea = data.get('mission_idea', '').lower()
    help_mode = data.get('help_mode', 'supplies')
    # Basic rule-based generation
    quest = {
        "quest_name": "OPERATION COZY PAWS",
        "mission_summary": "Collect blankets and food for at least 10 shelter cats in your city within two weeks.",
        "difficulty": "Easy",
        "estimated_duration_days": 14,
        "help_mode": help_mode,
        "steps": [
            {
                "id": 1,
                "title": "FIND YOUR ADULT ALLY",
                "description": "Ask a parent, guardian, or teacher if they can help you contact a local animal shelter.",
                "sgxp_reward": 10
            },
            {
                "id": 2,
                "title": "CONTACT THE SHELTER",
                "description": "With your adult, call or email the shelter to ask what supplies they need most.",
                "sgxp_reward": 15
            },
            {
                "id": 3,
                "title": "CREATE YOUR CALL TO ACTION",
                "description": "Make a simple flyer or message explaining your mission and what people can donate.",
                "sgxp_reward": 20
            },
            {
                "id": 4,
                "title": "LAUNCH THE DRIVE",
                "description": "Share your message with at least 5 people (neighbors, classmates, or friends).",
                "sgxp_reward": 25
            },
            {
                "id": 5,
                "title": "DELIVER THE LOOT",
                "description": "Collect the donations and deliver them to the shelter with your adult.",
                "sgxp_reward": 30
            }
        ],
        "reflection_prompts": [
            "What part of this quest do you feel most excited about?",
            "What might be tricky, and who could you ask for help?"
        ],
        "safety_notes": [
            "Always ask an adult before contacting organizations or meeting new people.",
            "Never share your home address or phone number with strangers."
        ]
    }
    return quest
