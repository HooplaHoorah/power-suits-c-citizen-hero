import os
import sys

# Add raindrop-backend to the Python path so we can import generate_quest
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'raindrop-backend'))

try:
    # Prefer the Day 3 generator if available (uses RAINDROP when configured)
    from generate_quest_day3 import generate_quest  # type: ignore
except ImportError:
    # Fallback to the original generate_quest implementation
    from generate_quest import generate_quest  # type: ignore


def test_generate_quest_fallback():
    """Ensure the quest generator returns a reasonable quest when RAINDROP is disabled."""
    # Clear RAINDROP API environment variables so the fallback path is exercised
    os.environ.pop('RAINDROP_API_URL', None)
    os.environ.pop('RAINDROP_API_KEY', None)
    data = {
        'mission_idea': 'clean up litter in the park',
        'help_mode': 'solo',
        'who': 'kids',
        'where': 'local park',
        'outcome': 'cleaner environment',
    }
    quest = generate_quest(data)
    # The generator should return a dictionary with the expected keys
    assert isinstance(quest, dict)
    for key in ['quest_name', 'mission_summary', 'steps', 'reflection_prompts', 'safety_notes']:
        assert key in quest
    # Steps should be a list with at least one entry
    assert isinstance(quest['steps'], list)
    assert len(quest['steps']) > 0
    first_step = quest['steps'][0]
    # Each step should include a reward field
    assert 'sgxp_reward' in first_step or 'reward' in first_step
