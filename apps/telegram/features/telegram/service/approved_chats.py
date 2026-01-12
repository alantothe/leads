from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import List, Optional


@dataclass(frozen=True)
class ApprovedChatRecord:
    chat_id: int
    title: str
    type: str
    category_id: int = 2  # Default to AI category


def _service_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _default_db_path() -> Path:
    # Point to the shared leads.db in apps/api
    return _service_root().parent.parent / "api" / "leads.db"


class ApprovedChatStore:
    def __init__(self, db_path: Optional[Path] = None) -> None:
        self._db_path = db_path or _default_db_path()
        self._lock = Lock()
        self._ensure_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_schema(self) -> None:
        # Schema is now managed by init_db.py in the main API
        # Just ensure the database file exists
        pass

    def list(self) -> List[ApprovedChatRecord]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT chat_id, title, type, category_id FROM telegram_feeds WHERE is_active = 1 ORDER BY chat_id"
            ).fetchall()
        return [
            ApprovedChatRecord(
                chat_id=row["chat_id"],
                title=row["title"],
                type=row["type"],
                category_id=row["category_id"],
            )
            for row in rows
        ]

    def get(self, chat_id: int) -> Optional[ApprovedChatRecord]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT chat_id, title, type, category_id FROM telegram_feeds WHERE chat_id = ?",
                (chat_id,),
            ).fetchone()
        if row is None:
            return None
        return ApprovedChatRecord(
            chat_id=row["chat_id"],
            title=row["title"],
            type=row["type"],
            category_id=row["category_id"],
        )

    def upsert(self, record: ApprovedChatRecord) -> bool:
        with self._lock:
            with self._connect() as conn:
                existing = conn.execute(
                    "SELECT 1 FROM telegram_feeds WHERE chat_id = ?",
                    (record.chat_id,),
                ).fetchone()
                if existing:
                    conn.execute(
                        "UPDATE telegram_feeds SET title = ?, type = ?, category_id = ? WHERE chat_id = ?",
                        (record.title, record.type, record.category_id, record.chat_id),
                    )
                    return False
                conn.execute(
                    "INSERT INTO telegram_feeds (chat_id, title, type, category_id, is_active) VALUES (?, ?, ?, ?, 1)",
                    (record.chat_id, record.title, record.type, record.category_id),
                )
                return True

    def delete(self, chat_id: int) -> bool:
        with self._lock:
            with self._connect() as conn:
                cursor = conn.execute(
                    "DELETE FROM telegram_feeds WHERE chat_id = ?",
                    (chat_id,),
                )
                return cursor.rowcount > 0
