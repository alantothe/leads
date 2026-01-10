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


def _service_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _default_db_path() -> Path:
    return _service_root() / "data" / "telegram.db"


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
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS approved_chats (
                    chat_id INTEGER PRIMARY KEY,
                    title TEXT NOT NULL,
                    type TEXT NOT NULL
                )
                """
            )

    def list(self) -> List[ApprovedChatRecord]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT chat_id, title, type FROM approved_chats ORDER BY chat_id"
            ).fetchall()
        return [
            ApprovedChatRecord(
                chat_id=row["chat_id"],
                title=row["title"],
                type=row["type"],
            )
            for row in rows
        ]

    def get(self, chat_id: int) -> Optional[ApprovedChatRecord]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT chat_id, title, type FROM approved_chats WHERE chat_id = ?",
                (chat_id,),
            ).fetchone()
        if row is None:
            return None
        return ApprovedChatRecord(
            chat_id=row["chat_id"],
            title=row["title"],
            type=row["type"],
        )

    def upsert(self, record: ApprovedChatRecord) -> bool:
        with self._lock:
            with self._connect() as conn:
                existing = conn.execute(
                    "SELECT 1 FROM approved_chats WHERE chat_id = ?",
                    (record.chat_id,),
                ).fetchone()
                if existing:
                    conn.execute(
                        "UPDATE approved_chats SET title = ?, type = ? WHERE chat_id = ?",
                        (record.title, record.type, record.chat_id),
                    )
                    return False
                conn.execute(
                    "INSERT INTO approved_chats (chat_id, title, type) VALUES (?, ?, ?)",
                    (record.chat_id, record.title, record.type),
                )
                return True

    def delete(self, chat_id: int) -> bool:
        with self._lock:
            with self._connect() as conn:
                cursor = conn.execute(
                    "DELETE FROM approved_chats WHERE chat_id = ?",
                    (chat_id,),
                )
                return cursor.rowcount > 0
