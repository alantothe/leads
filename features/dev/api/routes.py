from fastapi import APIRouter, HTTPException
from lib.database import execute_query, get_db_connection

router = APIRouter(prefix="/dev", tags=["development"])


@router.delete("/clear-all", status_code=200)
def clear_all_data():
    """Clear all data from the database (for development)."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Delete all data from all tables
        cursor.execute("DELETE FROM fetch_logs")
        cursor.execute("DELETE FROM leads")
        cursor.execute("DELETE FROM feed_tag_map")
        cursor.execute("DELETE FROM feed_tags")
        cursor.execute("DELETE FROM feeds")
        cursor.execute("DELETE FROM categories")

        # Reset autoincrement counters
        cursor.execute("DELETE FROM sqlite_sequence")

        conn.commit()
        conn.close()

        return {
            "message": "All data cleared successfully",
            "cleared": ["categories", "feeds", "feed_tags", "leads", "fetch_logs"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear-fetched", status_code=200)
def clear_fetched_data():
    """Clear only fetched data (leads and fetch logs), keeping categories, feeds, and tags."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Delete only leads and fetch logs
        cursor.execute("DELETE FROM fetch_logs")
        cursor.execute("DELETE FROM leads")

        # Reset autoincrement for these tables
        cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('leads', 'fetch_logs')")

        conn.commit()
        conn.close()

        return {
            "message": "Fetched data cleared successfully",
            "cleared": ["leads", "fetch_logs"],
            "preserved": ["categories", "feeds", "feed_tags"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
