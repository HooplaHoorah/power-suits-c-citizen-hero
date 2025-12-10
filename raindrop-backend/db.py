import os
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
    """
    Retrieve a list of quest records for a given session, flattening the nested
    quest_json field into the top-level dictionary.

    Each quest returned from the database includes metadata (id, session_id,
    created_at) and a JSON column `quest_json` containing the quest data.  The
    frontend expects a single-level dictionary with keys like `quest_name`,
    `steps` and `sgxp_reward` at the top level.  This helper merges the
    nested JSON with the metadata so callers receive a flattened representation.

    :param session_id: The user's session identifier (stored in cookie).
    :param limit: Maximum number of quests to return, newest first.
    :returns: A list of flattened quest dictionaries.
    """
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
        rows = cur.fetchall()
        quests = []
        for row in rows:
            # Start with the original quest JSON and merge in DB metadata.
            quest_data = dict(row['quest_json']) if row.get('quest_json') else {}
            quest_data.update({
                'id': row['id'],
                'session_id': row['session_id'],
                'created_at': row['created_at'].isoformat() if hasattr(row['created_at'], 'isoformat') else row['created_at'],
            })
            quests.append(quest_data)
        return quests


def get_quest_by_id(quest_id):
    """Retrieve a single quest by its ID."""
    with get_connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, session_id, created_at, quest_json
            FROM quests
            WHERE id = %s
            """",
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


def delete_quest(session_id, quest_id):
    """Delete a single quest for this session/client.

    Returns True if a row was deleted, False otherwise.
    """
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            DELETE FROM quests
            WHERE id = %s AND session_id = %s;
            """",
            (quest_id, session_id),
        )
        deleted = cur.rowcount
        conn.commit()
        return deleted > 0


def delete_all_quests(session_id):
    """Delete all quests for this session/client.

    Returns the number of rows deleted.
    """
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            DELETE FROM quests
            WHERE session_id = %s;
            """",
            (session_id,),
        )
        deleted = cur.rowcount
        conn.commit()
        return deleted
