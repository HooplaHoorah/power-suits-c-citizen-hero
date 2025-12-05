import os
import json
import psycopg2
from psycopg2.extras import Json, RealDictCursor

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg2.connect(DATABASE_URL)

def init_schema():
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS quests (
                id SERIAL PRIMARY KEY,
                session_id TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                quest_json JSONB
            );
            """
        )
        conn.commit()

def insert_quest(session_id, quest_payload):
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO quests (session_id, quest_json)
            VALUES (%s, %s)
            RETURNING id, created_at;
            """,
            (session_id, Json(quest_payload)),
        )
        row = cur.fetchone()
        conn.commit()
        return {"id": row[0], "created_at": row[1]}

def list_quests(session_id, limit=20):
    with get_connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, session_id, created_at, quest_json
            FROM quests
            WHERE session_id = %s
            ORDER BY created_at DESC
            LIMIT %s;
            """,
            (session_id, limit),
        )
        return cur.fetchall()

def get_quest_by_id(quest_id):
    """Retrieve a single quest by its ID."""
    with get_connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, session_id, created_at, quest_json
            FROM quests
            WHERE id = %s
            """,
            (quest_id,)
        )
        row = cur.fetchone()
        if row:
            quest = row['quest_json']
            quest.update({
                'id': row['id'],
                'session_id': row['session_id'],
                'created_at': row['created_at'].isoformat() if hasattr(row['created_at'], 'isoformat') else row['created_at']
            })
            return quest
        return None
