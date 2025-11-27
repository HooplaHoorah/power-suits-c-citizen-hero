"""
Enhanced quest generation logic for the Citizen Hero prototype.

This module extends the original ``generate_quest`` function to support
clarifying details (who the quest is for, where it takes place and what
success looks like) while attempting to leverage Raindrop’s
SmartInference service when configured via environment variables.  If
the SmartInference service is unavailable or misconfigured, it falls
back to a simple rule‑based generator that personalises the mission
summary using the provided details.  The structure of the returned
dictionary matches the expected Quest JSON defined in ``prompt.md``.

Environment variables used:

- ``RAINDROP_API_URL`` – URL of the SmartInference endpoint.
- ``RAINDROP_API_KEY`` – Bearer token for authenticating with
  SmartInference.

Future enhancements could include capturing the user’s nickname, age
range and session ID for storage alongside the quest in the database,
and integrating with Vultr’s SmartSQL via a ``DATABASE_URL``.
"""

from __future__ import annotations

import os
import requests
from typing import Any, Dict


def generate_quest(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a quest dictionary based on mission details and optional
    clarifying information.

    The function first attempts to call a Raindrop SmartInference
    endpoint.  If the call fails or the endpoint is not configured, it
    falls back to a rule‑based generator that incorporates the
    clarifying details into the mission summary when possible.

    Parameters
    ----------
    data : dict
        A dictionary containing some or all of the following keys:

        - ``mission_idea`` (str): The user’s initial problem or idea.
        - ``help_mode`` (str): One of "supplies", "awareness", or
          "helpers".
        - ``who`` (str, optional): The target group or beneficiary for
          the quest.
        - ``where`` (str, optional): The geographical focus of the
          quest.
        - ``outcome`` (str, optional): The desired result or success
          criteria.

    Returns
    -------
    dict
        A quest object with keys ``quest_name``, ``mission_summary``,
        ``difficulty``, ``estimated_duration_days``, ``help_mode``,
        ``steps``, ``reflection_prompts`` and ``safety_notes``.
    """
    # Extract the primary and clarifying parameters
    mission_idea: str = (data.get("mission_idea") or "").strip()
    help_mode: str = data.get("help_mode") or "supplies"
    who: str = (data.get("who") or "").strip()
    where: str = (data.get("where") or "").strip()
    outcome: str = (data.get("outcome") or "").strip()

    # Attempt to call the Raindrop SmartInference API if configured
    api_url = os.getenv("RAINDROP_API_URL")
    api_key = os.getenv("RAINDROP_API_KEY")
    if api_url and api_key:
        payload = {
            "mission_idea": mission_idea,
            "help_mode": help_mode,
            "who": who,
            "where": where,
            "outcome": outcome,
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }
        try:
            response = requests.post(api_url, json=payload, headers=headers, timeout=15)
            # If we get a valid JSON response from SmartInference, return it
            if response.ok:
                quest = response.json()
                # Basic validation: ensure required fields are present
                if isinstance(quest, dict) and "quest_name" in quest and "steps" in quest:
                    return quest
        except Exception as exc:
            # Log exception for debugging; fallback to offline generation
            print(f"SmartInference call failed: {exc}")

    # Offline rule‑based generation
    # Craft a mission summary using clarifying details when available
    if who and where and outcome:
        mission_summary = f"Help {who} by {outcome} in {where}."
        # Generate a simple operation name using the first word of 'who'
        quest_name = f"OPERATION {who.upper().split()[0]}"
    else:
        mission_summary = (
            "Collect blankets and food for at least 10 shelter cats in your city within two weeks."
        )
        quest_name = "OPERATION COZY PAWS"

    # Build a quest object with a minimal set of steps.  SGXP rewards can
    # be adjusted later based on difficulty and time required.
    quest = {
        "quest_name": quest_name,
        "mission_summary": mission_summary,
        "difficulty": "Easy",
        "estimated_duration_days": 14,
        "help_mode": help_mode,
        "steps": [
            {
                "id": 1,
                "title": "Find your adult ally",
                "description": "Ask a parent, guardian, or teacher if they can help you start this mission.",
                "sgxp_reward": 10,
            },
            {
                "id": 2,
                "title": "Reach out to your target",
                "description": "With your adult, contact the organisation or people you want to help to learn what they need most.",
                "sgxp_reward": 15,
            },
            {
                "id": 3,
                "title": "Create a call to action",
                "description": "Make a simple flyer or message explaining your mission and what people can contribute.",
                "sgxp_reward": 20,
            },
            {
                "id": 4,
                "title": "Gather support",
                "description": "Share your message with friends, family and neighbours to collect contributions.",
                "sgxp_reward": 25,
            },
            {
                "id": 5,
                "title": "Deliver the impact",
                "description": "Deliver the collected items or support to those you set out to help and thank everyone involved.",
                "sgxp_reward": 30,
            },
        ],
        "reflection_prompts": [
            "How did it feel to work toward this mission?",
            "What challenges did you overcome?",
            "Who helped you along the way?",
        ],
        "safety_notes": [
            "Always involve a trusted adult when contacting organisations or meeting new people.",
            "Never share personal information such as your home address or phone number with strangers.",
        ],
    }
    return quest
