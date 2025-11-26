from flask import Flask, request, jsonify
from generate_quest import generate_quest

app = Flask(__name__)

@app.route('/generate-quest', methods=['POST'])
def generate_quest_endpoint():
    data = request.get_json()
    quest = generate_quest(data)
    return jsonify(quest)
