from flask import Flask, request, jsonify
from generate_quest import generate_quest
import sqlite3
import json
import os

# Initialize Flask app
app = Flask(__name__)

# Determine path to the SQLite database relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'quests.db')


def init_db():
    """Create the quests table if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS quests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quest_json TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


def save_quest(quest: dict) -> int:
    """Persist a quest dictionary to the SQLite database and return its ID."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO quests (quest_json) VALUES (?)", (json.dumps(quest),))
    quest_id = c.lastrowid
    conn.commit()
    conn.close()
    return quest_id


def get_all_quests() -> list:
    """Retrieve all quests from the database with their IDs."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, quest_json FROM quests")
    rows = c.fetchall()
    conn.close()
    return [dict(id=row[0], **json.loads(row[1])) for row in rows]


def get_quest_by_id(quest_id: int):
    """Retrieve a single quest by its ID."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT quest_json FROM quests WHERE id = ?", (quest_id,))
    row = c.fetchone()
    conn.close()
    if row:
        return json.loads(row[0])
    return None


# Ensure database and table are created when the app starts
init_db()


@app.route('/generate-quest', methods=['POST'])
def generate_quest_endpoint():
    """Endpoint to generate a quest from user-provided data and save it to the database."""
    data = request.get_json() or {}
    quest = generate_quest(data)
    quest_id = save_quest(quest)
    quest_with_id = dict(id=quest_id, **quest)
    return jsonify(quest_with_id)


@app.route('/quests', methods=['GET'])
def get_quests():
    """Endpoint to retrieve all saved quests from the database."""
    quests = get_all_quests()
    return jsonify(quests)


@app.route('/quests/<int:quest_id>', methods=['GET'])
def get_quest(quest_id):
    """Endpoint to retrieve a single quest by its ID."""
    quest = get_quest_by_id(quest_id)
    if quest is None:
        return jsonify({"error": "Quest not found"}), 404
    quest_with_id = dict(id=quest_id, **quest)
    return jsonify(quest_with_id)
