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


def save_quest(quest: dict) -> None:
    """Persist a quest dictionary to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO quests (quest_json) VALUES (?)", (json.dumps(quest),))
    conn.commit()
    conn.close()


def get_all_quests() -> list:
    """Retrieve all quests from the database and return them as Python dictionaries."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT quest_json FROM quests")
    rows = c.fetchall()
    conn.close()
    return [json.loads(row[0]) for row in rows]


# Ensure database and table are created when the app starts
init_db()


@app.route('/generate-quest', methods=['POST'])
def generate_quest_endpoint():
    """Endpoint to generate a quest from user-provided data and save it to the database."""
    data = request.get_json() or {}
    quest = generate_quest(data)
    save_quest(quest)
    return jsonify(quest)


@app.route('/quests', methods=['GET'])
def get_quests():
    """Endpoint to retrieve all saved quests from the database."""
    quests = get_all_quests()
    return jsonify(quests)
