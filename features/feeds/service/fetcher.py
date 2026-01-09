from datetime import datetime
from typing import Dict, List
from features.feed.service.parser import parse_feed
from lib.database import fetch_one, execute_query


def fetch_feed(feed_id: int) -> Dict:
    """
    Fetch RSS feed and create leads.
    Returns a dict with status, lead_count, and error_message.
    """
    feed = fetch_one("SELECT * FROM feeds WHERE id = ?", (feed_id,))
    if not feed:
        raise ValueError(f"Feed {feed_id} not found")

    try:
        # Parse the RSS feed
        feed_data = parse_feed(feed["url"])

        lead_count = 0
        errors = []

        # Create leads from entries
        for entry in feed_data.entries:
            try:
                # Check if lead already exists
                existing = fetch_one(
                    "SELECT id FROM leads WHERE feed_id = ? AND guid = ?",
                    (feed_id, entry.id)
                )

                if not existing:
                    execute_query(
                        """INSERT INTO leads
                           (feed_id, guid, title, link, author, summary, content, published)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                        (feed_id, entry.id, entry.title, entry.link, entry.author,
                         entry.summary, entry.content, entry.published)
                    )
                    lead_count += 1
            except Exception as e:
                errors.append(f"Entry '{entry.title}': {str(e)}")

        # Update last_fetched timestamp
        execute_query(
            "UPDATE feeds SET last_fetched = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), feed_id)
        )

        # Create fetch log
        status = "SUCCESS" if not errors else "FAILED"
        error_message = "; ".join(errors) if errors else None

        log_id = execute_query(
            """INSERT INTO fetch_logs
               (feed_id, status, lead_count, error_message)
               VALUES (?, ?, ?, ?)""",
            (feed_id, status, lead_count, error_message)
        )

        return {
            "log_id": log_id,
            "status": status,
            "lead_count": lead_count,
            "error_message": error_message
        }

    except Exception as e:
        # Create failed fetch log
        error_message = str(e)
        log_id = execute_query(
            """INSERT INTO fetch_logs
               (feed_id, status, lead_count, error_message)
               VALUES (?, ?, ?, ?)""",
            (feed_id, "FAILED", 0, error_message)
        )

        return {
            "log_id": log_id,
            "status": "FAILED",
            "lead_count": 0,
            "error_message": error_message
        }


def fetch_all_active_feeds() -> List[Dict]:
    """
    Fetch all active feeds.
    Returns a list of fetch results.
    """
    from lib.database import fetch_all

    feeds = fetch_all("SELECT id FROM feeds WHERE is_active = 1", ())
    results = []

    for feed in feeds:
        try:
            result = fetch_feed(feed["id"])
            results.append({
                "feed_id": feed["id"],
                **result
            })
        except Exception as e:
            results.append({
                "feed_id": feed["id"],
                "status": "FAILED",
                "lead_count": 0,
                "error_message": str(e)
            })

    return results
