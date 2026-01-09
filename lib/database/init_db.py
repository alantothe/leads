import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).parent.parent.parent / "leads.db"


def init_database():
    """Initialize the database with schema and seed data."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Create categories table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    """)

    # Create feeds table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            url TEXT UNIQUE NOT NULL,
            source_name TEXT NOT NULL,
            website TEXT,
            fetch_interval INTEGER DEFAULT 30,
            last_fetched TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)

    # Create feed_tags table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feed_tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    """)

    # Create feed_tag_map table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feed_tag_map (
            feed_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (feed_id, tag_id),
            FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES feed_tags(id) ON DELETE CASCADE
        )
    """)

    # Create leads table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feed_id INTEGER NOT NULL,
            guid TEXT UNIQUE,
            title TEXT NOT NULL,
            link TEXT NOT NULL,
            author TEXT,
            summary TEXT,
            content TEXT,
            published TEXT,
            collected_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (feed_id) REFERENCES feeds(id)
        )
    """)

    # Create fetch_logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fetch_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feed_id INTEGER NOT NULL,
            fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT,
            lead_count INTEGER,
            error_message TEXT,
            FOREIGN KEY (feed_id) REFERENCES feeds(id)
        )
    """)

    # Insert seed data for categories
    categories = [
        (1, "Jobs"),
        (2, "AI"),
        (3, "Crypto")
    ]
    cursor.executemany(
        "INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?)",
        categories
    )

    # Insert seed data for feeds
    feeds = [
        (1, 1, "https://weworkremotely.com/categories/remote-programming-jobs.rss", "WeWorkRemotely", "weworkremotely.com", 15, "2026-01-07 10:00:00", 1),
        (2, 2, "https://openai.com/blog/rss", "OpenAI Blog", "openai.com", 60, "2026-01-06 18:22:11", 1),
        (3, 3, "https://cointelegraph.com/rss", "CoinTelegraph", "cointelegraph.com", 20, "2026-01-07 09:15:00", 1)
    ]
    cursor.executemany(
        """INSERT OR IGNORE INTO feeds
           (id, category_id, url, source_name, website, fetch_interval, last_fetched, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        feeds
    )

    # Insert seed data for tags
    tags = [
        (1, "Remote"),
        (2, "Python"),
        (3, "Senior"),
        (4, "DeFi"),
        (5, "Startups")
    ]
    cursor.executemany(
        "INSERT OR IGNORE INTO feed_tags (id, name) VALUES (?, ?)",
        tags
    )

    # Insert seed data for feed_tag_map
    feed_tag_mappings = [
        (1, 1),  # WeWorkRemotely -> Remote
        (1, 2),  # WeWorkRemotely -> Python
        (1, 3),  # WeWorkRemotely -> Senior
        (3, 4)   # CoinTelegraph -> DeFi
    ]
    cursor.executemany(
        "INSERT OR IGNORE INTO feed_tag_map (feed_id, tag_id) VALUES (?, ?)",
        feed_tag_mappings
    )

    # Insert sample leads
    leads = [
        (1, 1, "job-123abc", "Senior Python Developer", "https://example.com/job1", "John", "Remote Python role with AI focus", None, "2026-01-07"),
        (2, 1, "job-999xyz", "ML Engineer", "https://example.com/job2", "Sarah", "AI startup hiring for ML position", None, "2026-01-06"),
        (3, 2, "openai-post-55", "GPT-5 Launch", "https://example.com/post", "OpenAI", "New model released with enhanced capabilities", None, "2026-01-05")
    ]
    cursor.executemany(
        """INSERT OR IGNORE INTO leads
           (id, feed_id, guid, title, link, author, summary, content, published)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        leads
    )

    # Insert sample fetch logs
    fetch_logs = [
        (1, 1, "2026-01-07 10:00:00", "SUCCESS", 22, None),
        (2, 2, "2026-01-07 10:00:01", "FAILED", 0, "Timeout"),
        (3, 3, "2026-01-07 10:00:01", "SUCCESS", 5, None)
    ]
    cursor.executemany(
        """INSERT OR IGNORE INTO fetch_logs
           (id, feed_id, fetched_at, status, lead_count, error_message)
           VALUES (?, ?, ?, ?, ?, ?)""",
        fetch_logs
    )

    conn.commit()
    conn.close()
    print(f"✅ Database initialized at {DATABASE_PATH}")


if __name__ == "__main__":
    init_database()
