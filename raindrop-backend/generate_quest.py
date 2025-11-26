import os
import requests


def generate_quest(data):
    """
    Generate a quest based on the provided mission idea and help mode.
    Attempts to call a RAINDROP SmartInference endpoint if configured via environment variables.
    If the call fails or is not configured, falls back to a simple rule-based generator.
    """
    # Extract parameters from the incoming data dictionary
    mission_idea = data.get('mission_idea', '').strip()
    help_mode = data.get('help_mode', 'supplies')

    # Attempt to call a RAINDROP SmartInference endpoint
    api_url = os.getenv("RAINDROP_API_URL")
    api_key = os.getenv("RAINDROP_API_KEY")
    if api_url and api_key:
        try:
            payload = {
                "mission_idea": mission_idea,
                "help_mode": help_mode
            }
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            response = requests.post(api_url, json=payload, headers=headers, timeout=15)
            # If the response is successful, return the JSON as the quest
            if response.ok:
                quest = response.json()
                return quest
        except Exception as e:
            # Print any exceptions for debugging and fall back to stub
            print(f"RAINDROP API error: {e}")

    # Fallback rule-based quest generation
    quest = {
        "quest_name": "Operation Cozy Paws",
        "mission_summary": "Collect blankets and food for at least 10 shelter cats in your city within two weeks.",
        "difficulty": "Easy",
        "estimated_duration_days": 14,
        "help_mode": help_mode,
        "steps": [
            {
                "id": 1,
                "title": "Find your adult ally",
                "description": "Ask a parent, guardian, or teacher if they can help you contact a local animal shelter.",
                "sgxp_reward": 10
            },
            {
                "id": 2,
                "title": "Contact the shelter",
                "description": "With your adult, call or email the shelter to ask what supplies they need most.",
                "sgxp_reward": 15
            },
            {
                "id": 3,
                "title": "Create your call to action",
                "description": "Make a simple flyer or message explaining your mission and what people can donate.",
                "sgxp_reward": 20
            },
            {
                "id": 4,
                "title": "Gather donations",
                "description": "Collect the blankets and food from friends, neighbors, and community members.",
                "sgxp_reward": 25
            },
            {
                "id": 5,
                "title": "Deliver the donations",
                "description": "Bring the supplies to the shelter and thank them for their work.",
                "sgxp_reward": 30
            }
        ],
        "reflection_prompts": [
            "How did it feel to help animals in need?",
            "What was challenging about organizing the collection?",
            "What would you do differently next time?"
        ],
        "safety_notes": [
            "Always involve a trusted adult when contacting or visiting the shelter.",
            "Use safe transportation when delivering supplies."
        ]
    }

    return quest
