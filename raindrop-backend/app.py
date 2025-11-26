from flask import Flask, request, jsonify
from generate_quest import generate_quest

app = Flask(__name__)

# In-memory quest storage for demo purposes
quests_db = []

@app.route('/generate-quest', methods=['POST'])
def generate_quest_endpoint():
    data = request.get_json()
    quest = generate_quest(data)
    # Save quest to in-memory DB
    quests_db.append(quest)
    return jsonify(quest)

@app.route('/quests', methods=['GET'])
def get_quests():
    # Return all saved quests
    return jsonify(quests_db)
