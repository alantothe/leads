from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional
import sys

from features.telegram.service.client import TelegramService, load_settings

# Add parent paths to sys.path to import from apps/api
api_path = Path(__file__).resolve().parents[3] / "api"
sys.path.insert(0, str(api_path))
from features.translation.service.translator import get_translator


def _default_db_path() -> Path:
    # Point to the shared leads.db in apps/api
    service_root = Path(__file__).resolve().parents[3]
    return service_root.parent.parent / "api" / "leads.db"


def _connect_db(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


async def fetch_telegram_feed(
    chat_id: int, limit: int = 50, db_path: Optional[Path] = None
) -> Dict:
    """
    Fetch posts from a Telegram channel/group and persist to database.

    Args:
        chat_id: The Telegram chat ID to fetch from
        limit: Maximum number of posts to fetch
        db_path: Optional database path (defaults to leads.db)

    Returns:
        Dict with log_id, status, post_count, and error_message
    """
    db_path = db_path or _default_db_path()
    conn = _connect_db(db_path)
    cursor = conn.cursor()

    # Get the telegram_feed_id from the database
    feed_row = cursor.execute(
        "SELECT id, title FROM telegram_feeds WHERE chat_id = ?", (chat_id,)
    ).fetchone()

    if not feed_row:
        conn.close()
        return {
            "status": "FAILED",
            "post_count": 0,
            "error_message": f"Telegram feed with chat_id {chat_id} not found in database",
        }

    telegram_feed_id = feed_row["id"]
    feed_title = feed_row["title"]

    # Initialize Telegram service
    try:
        settings = load_settings()
        service = TelegramService(settings)
        await service.connect()

        # Check authorization
        if not await service.is_authorized():
            conn.close()
            return {
                "status": "FAILED",
                "post_count": 0,
                "error_message": "Telegram session is not authorized",
            }

        # Fetch posts from Telegram
        posts = await service.get_channel_posts(chat_id, limit)

    except Exception as e:
        conn.close()
        error_msg = str(e)

        # Log the failed fetch
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO telegram_fetch_logs
               (telegram_feed_id, status, post_count, error_message)
               VALUES (?, ?, ?, ?)""",
            (telegram_feed_id, "FAILED", 0, error_msg),
        )
        conn.commit()
        log_id = cursor.lastrowid
        conn.close()

        return {
            "log_id": log_id,
            "status": "FAILED",
            "post_count": 0,
            "error_message": error_msg,
        }
    finally:
        await service.disconnect()

    # Store posts in database
    new_post_count = 0
    errors = []

    # Get translator for language detection and translation
    translator = get_translator()

    for post in posts:
        try:
            # Check if post already exists
            existing = cursor.execute(
                "SELECT id FROM telegram_posts WHERE telegram_feed_id = ? AND message_id = ?",
                (telegram_feed_id, post.id),
            ).fetchone()

            if existing:
                continue  # Skip duplicate

            # Extract sender information
            sender_id = post.sender.id if post.sender else None
            sender_name = post.sender.name if post.sender else None
            sender_username = post.sender.username if post.sender else None
            sender_type = post.sender.type if post.sender else None

            # Extract media information
            media_type = post.media.media_type if post.media else None
            media_file_name = post.media.file_name if post.media else None

            # Convert datetime to ISO format string
            timestamp = post.timestamp.isoformat() if post.timestamp else None

            # Auto-detect language and translate text if not English
            text_translated = None
            detected_language = None
            translation_status = 'already_english'
            translated_at = None

            if post.text:
                detected_language = translator.detect_language(post.text)

                if detected_language and detected_language != 'en':
                    text_translated, trans_status = translator.translate_text(
                        post.text, source=detected_language, target='en'
                    )
                    translation_status = 'translated'
                    translated_at = datetime.utcnow().isoformat()

            # Insert new post
            cursor.execute(
                """INSERT INTO telegram_posts
                   (telegram_feed_id, message_id, text, timestamp,
                    sender_id, sender_name, sender_username, sender_type,
                    media_type, media_file_name, approval_status,
                    text_translated, detected_language, translation_status, translated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    telegram_feed_id,
                    post.id,
                    post.text,
                    timestamp,
                    sender_id,
                    sender_name,
                    sender_username,
                    sender_type,
                    media_type,
                    media_file_name,
                    'pending',
                    text_translated,
                    detected_language,
                    translation_status,
                    translated_at,
                ),
            )
            new_post_count += 1

        except Exception as e:
            errors.append(f"Post {post.id}: {str(e)}")
            continue

    # Update feed's last_fetched timestamp
    cursor.execute(
        "UPDATE telegram_feeds SET last_fetched = ? WHERE id = ?",
        (datetime.utcnow().isoformat(), telegram_feed_id),
    )

    # Determine status
    if errors and new_post_count == 0:
        status = "FAILED"
    elif errors:
        status = "PARTIAL"
    else:
        status = "SUCCESS"

    error_message = "; ".join(errors) if errors else None

    # Create fetch log
    cursor.execute(
        """INSERT INTO telegram_fetch_logs
           (telegram_feed_id, status, post_count, error_message)
           VALUES (?, ?, ?, ?)""",
        (telegram_feed_id, status, new_post_count, error_message),
    )

    log_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "log_id": log_id,
        "status": status,
        "post_count": new_post_count,
        "error_message": error_message,
    }


async def fetch_all_active_telegram_feeds(
    limit: int = 50, db_path: Optional[Path] = None
) -> Dict:
    """
    Fetch posts from all active Telegram feeds.

    Args:
        limit: Maximum number of posts to fetch per feed
        db_path: Optional database path (defaults to leads.db)

    Returns:
        Dict with summary of fetch results
    """
    db_path = db_path or _default_db_path()
    conn = _connect_db(db_path)
    cursor = conn.cursor()

    # Get all active feeds
    feeds = cursor.execute(
        "SELECT chat_id, title FROM telegram_feeds WHERE is_active = 1"
    ).fetchall()

    conn.close()

    if not feeds:
        return {
            "status": "SUCCESS",
            "feeds_processed": 0,
            "total_posts": 0,
            "message": "No active Telegram feeds found",
        }

    results = []
    total_posts = 0

    for feed in feeds:
        chat_id = feed["chat_id"]
        title = feed["title"]

        try:
            result = await fetch_telegram_feed(chat_id, limit, db_path)
            results.append({
                "chat_id": chat_id,
                "title": title,
                "status": result["status"],
                "post_count": result["post_count"],
            })
            total_posts += result["post_count"]
        except Exception as e:
            results.append({
                "chat_id": chat_id,
                "title": title,
                "status": "FAILED",
                "error": str(e),
            })

    return {
        "status": "SUCCESS",
        "feeds_processed": len(feeds),
        "total_posts": total_posts,
        "results": results,
    }
