import os
import sys

# Add raindrop-backend to the Python path so we can import the Flask app
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'raindrop-backend'))

from app import app  # type: ignore


def test_generate_and_get_quests():
    """Ensure the API endpoints create and fetch quests correctly."""
    client = app.test_client()
    # Generate a new quest via POST
    resp = client.post('/generate-quest', json={'mission_idea': 'plant a community garden', 'help_mode': 'solo'})
    assert resp.status_code == 200
    created = resp.get_json()
    assert isinstance(created, dict)
    assert 'id' in created
    quest_id = created['id']
    assert 'quest_name' in created
    # Fetch all quests
    resp_all = client.get('/quests')
    assert resp_all.status_code == 200
    quests = resp_all.get_json()
    assert isinstance(quests, list)
    # The created quest should be present in the list
    assert any(q['id'] == quest_id for q in quests)
    # Fetch the single quest by ID
    resp_single = client.get(f'/quests/{quest_id}')
    assert resp_single.status_code == 200
    single = resp_single.get_json()
    assert single['id'] == quest_id
    # Ensure the details match what was returned on creation
    assert single['quest_name'] == created['quest_name']
