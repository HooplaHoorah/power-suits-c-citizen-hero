from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from generate_quest import generate_quest, generate_clarifying_questions
import os
import uuid

# Import Postgres DB helper
import db

# Initialize Flask app
app = Flask(
    __name__,
    static_folder=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend")),
    static_url_path="/"
)
CORS(app)

# Initialize DB schema on startup (production will have DATABASE_URL set)
if os.getenv("APP_ENV") == "production":
    db.init_schema()
else:
    # For local dev, fallback to SQLite if DATABASE_URL not set (optional)
    try:
        db.init_schema()
    except Exception as e:
        print(f"Postgres not configured, skipping DB init: {e}")

@app.route('/healthz', methods=['GET'])
def healthz():
    """Simple health‑check endpoint used by deployment platforms."""
    return jsonify({"status": "ok"}), 200

@app.route('/clarify-mission', methods=['POST'])
def clarify_mission_endpoint():
    """Endpoint to generate clarifying questions."""
    data = request.get_json() or {}
    questions = generate_clarifying_questions(data)
    return jsonify({"questions": questions})

def _get_session_id():
    """Retrieve a session identifier for persisting quests.
    Uses a cookie if present, otherwise generates a UUID and sets it in the response.
    """
    session_id = request.cookies.get('session_id')
    if not session_id:
        session_id = str(uuid.uuid4())
    return session_id

@app.route('/generate-quest', methods=['POST'])
def generate_quest_endpoint():
    """Generate a quest, persist it to Postgres, and return the stored record."""
    data = request.get_json() or {}
    quest = generate_quest(data)
    session_id = _get_session_id()
    # Insert into Postgres and get generated id/created_at
    if os.getenv("DATABASE_URL"):
        try:
            inserted = db.insert_quest(session_id, quest)
            quest_with_meta = {"id": inserted["id"], "created_at": inserted["created_at"], **quest}
        except Exception as e:
            print(f"DB Insert failed: {e}")
            # Fallback for when DB is configured but fails
            quest_with_meta = {"id": 0, "created_at": "local-dev", **quest}
    else:
        # Local dev without DB
        quest_with_meta = {"id": 0, "created_at": "local-dev", **quest}

    resp = make_response(jsonify(quest_with_meta))
    # Ensure the session cookie is set for the client
    resp.set_cookie('session_id', session_id, httponly=True, samesite='Lax')
    return resp

@app.route('/quests', methods=['GET'])
def get_quests():
    """Retrieve all quests for the current session from Postgres."""
    if not os.getenv("DATABASE_URL"):
        return jsonify([])
    session_id = _get_session_id()
    quests = db.list_quests(session_id)
    return jsonify(quests)

@app.route('/quests/<int:quest_id>', methods=['GET'])
def get_quest(quest_id):
    """Retrieve a single quest by its ID from Postgres."""
    quest = db.get_quest_by_id(quest_id)
    if quest is None:
        return jsonify({"error": "Quest not found"}), 404
    return jsonify(quest)

# Serve the frontend entry point
@app.route("/", methods=["GET"]) 
def serve_frontend():
    return send_from_directory(app.static_folder, "index.html")

if __name__ == '__main__':
    # Default to debug mode for local development
    app.run(debug=True, port=5000)
