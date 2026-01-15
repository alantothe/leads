import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).parent.parent.parent / "leads.db"


def add_image_columns():
    """Add image_url column to content tables."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Helper function to check if column exists
    def column_exists(table_name, column_name):
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [row[1] for row in cursor.fetchall()]
        return column_name in columns

    # Add image_url to leads table
    if not column_exists('leads', 'image_url'):
        cursor.execute("ALTER TABLE leads ADD COLUMN image_url TEXT")

    conn.commit()
    conn.close()
    print("✅ Image columns added to content tables")


def add_translation_columns():
    """Add translation columns to all content tables."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Helper function to check if column exists
    def column_exists(table_name, column_name):
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [row[1] for row in cursor.fetchall()]
        return column_name in columns

    # Add translation columns to leads table
    if not column_exists('leads', 'title_translated'):
        cursor.execute("ALTER TABLE leads ADD COLUMN title_translated TEXT")
    if not column_exists('leads', 'summary_translated'):
        cursor.execute("ALTER TABLE leads ADD COLUMN summary_translated TEXT")
    if not column_exists('leads', 'content_translated'):
        cursor.execute("ALTER TABLE leads ADD COLUMN content_translated TEXT")
    if not column_exists('leads', 'detected_language'):
        cursor.execute("ALTER TABLE leads ADD COLUMN detected_language TEXT")
    if not column_exists('leads', 'translation_status'):
        cursor.execute("ALTER TABLE leads ADD COLUMN translation_status TEXT DEFAULT 'pending'")
    if not column_exists('leads', 'translated_at'):
        cursor.execute("ALTER TABLE leads ADD COLUMN translated_at TEXT")

    # Add translation columns to instagram_posts table
    if not column_exists('instagram_posts', 'caption_translated'):
        cursor.execute("ALTER TABLE instagram_posts ADD COLUMN caption_translated TEXT")
    if not column_exists('instagram_posts', 'detected_language'):
        cursor.execute("ALTER TABLE instagram_posts ADD COLUMN detected_language TEXT")
    if not column_exists('instagram_posts', 'translation_status'):
        cursor.execute("ALTER TABLE instagram_posts ADD COLUMN translation_status TEXT DEFAULT 'pending'")
    if not column_exists('instagram_posts', 'translated_at'):
        cursor.execute("ALTER TABLE instagram_posts ADD COLUMN translated_at TEXT")

    # Add translation columns to reddit_posts table
    if not column_exists('reddit_posts', 'title_translated'):
        cursor.execute("ALTER TABLE reddit_posts ADD COLUMN title_translated TEXT")
    if not column_exists('reddit_posts', 'selftext_translated'):
        cursor.execute("ALTER TABLE reddit_posts ADD COLUMN selftext_translated TEXT")
    if not column_exists('reddit_posts', 'detected_language'):
        cursor.execute("ALTER TABLE reddit_posts ADD COLUMN detected_language TEXT")
    if not column_exists('reddit_posts', 'translation_status'):
        cursor.execute("ALTER TABLE reddit_posts ADD COLUMN translation_status TEXT DEFAULT 'pending'")
    if not column_exists('reddit_posts', 'translated_at'):
        cursor.execute("ALTER TABLE reddit_posts ADD COLUMN translated_at TEXT")

    conn.commit()
    conn.close()
    print("✅ Translation columns added to all content tables")


def add_approval_columns():
    """Add approval workflow columns to all content tables."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Helper function to check if column exists
    def column_exists(table_name, column_name):
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [row[1] for row in cursor.fetchall()]
        return column_name in columns

    tables = ['leads', 'instagram_posts', 'reddit_posts']

    for table in tables:
        # Add approval_status column with DEFAULT 'approved' for existing records
        if not column_exists(table, 'approval_status'):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN approval_status TEXT DEFAULT 'approved'")

        # Add approved_by column
        if not column_exists(table, 'approved_by'):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN approved_by TEXT")

        # Add approved_at column
        if not column_exists(table, 'approved_at'):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN approved_at TEXT")

        # Add approval_notes column
        if not column_exists(table, 'approval_notes'):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN approval_notes TEXT")

    # Auto-approve all existing content (set explicit value for NULL entries)
    for table in tables:
        cursor.execute(f"UPDATE {table} SET approval_status = 'approved' WHERE approval_status IS NULL")

    conn.commit()
    conn.close()
    print("✅ Approval columns added to all content tables")


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

    # Create instagram_feeds table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS instagram_feeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            username TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            profile_url TEXT,
            fetch_interval INTEGER DEFAULT 60,
            last_fetched TEXT,
            last_max_id TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)

    # Create instagram_posts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS instagram_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instagram_feed_id INTEGER NOT NULL,
            post_id TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            caption TEXT,
            media_type TEXT,
            media_url TEXT,
            thumbnail_url TEXT,
            like_count INTEGER DEFAULT 0,
            comment_count INTEGER DEFAULT 0,
            view_count INTEGER,
            posted_at TEXT,
            permalink TEXT,
            collected_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (instagram_feed_id) REFERENCES instagram_feeds(id) ON DELETE CASCADE
        )
    """)

    # Create instagram_feed_tag_map table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS instagram_feed_tag_map (
            instagram_feed_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (instagram_feed_id, tag_id),
            FOREIGN KEY (instagram_feed_id) REFERENCES instagram_feeds(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES feed_tags(id) ON DELETE CASCADE
        )
    """)

    # Create instagram_fetch_logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS instagram_fetch_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instagram_feed_id INTEGER NOT NULL,
            fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT,
            post_count INTEGER,
            max_id TEXT,
            error_message TEXT,
            FOREIGN KEY (instagram_feed_id) REFERENCES instagram_feeds(id) ON DELETE CASCADE
        )
    """)

    # Create reddit_feeds table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reddit_feeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            subreddit TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)

    # Create reddit_posts table (if not exists)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reddit_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reddit_feed_id INTEGER NOT NULL,
            post_id TEXT UNIQUE NOT NULL,
            subreddit TEXT NOT NULL,
            title TEXT NOT NULL,
            author TEXT,
            score INTEGER DEFAULT 0,
            num_comments INTEGER DEFAULT 0,
            permalink TEXT,
            url TEXT,
            selftext TEXT,
            created_utc INTEGER,
            post_type TEXT,
            collected_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (reddit_feed_id) REFERENCES reddit_feeds(id) ON DELETE CASCADE
        )
    """)

    # Create reddit_feed_tag_map table (if not exists)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reddit_feed_tag_map (
            reddit_feed_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (reddit_feed_id, tag_id),
            FOREIGN KEY (reddit_feed_id) REFERENCES reddit_feeds(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES feed_tags(id) ON DELETE CASCADE
        )
    """)

    # Create reddit_fetch_logs table (if not exists)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reddit_fetch_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reddit_feed_id INTEGER NOT NULL,
            fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT,
            post_count INTEGER,
            error_message TEXT,
            FOREIGN KEY (reddit_feed_id) REFERENCES reddit_feeds(id) ON DELETE CASCADE
        )
    """)

    # Insert seed data for categories
    categories = [
        (1, "Jobs"),
        (2, "AI"),
        (3, "Crypto"),
        (4, "Peru"),
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

    # Insert seed data for instagram_feeds
    instagram_feeds = [
        (1, 2, "openai", "OpenAI Official", "https://instagram.com/openai", 60, None, None, 1),
        (2, 1, "ycombinator", "Y Combinator", "https://instagram.com/ycombinator", 60, None, None, 1)
    ]
    cursor.executemany(
        """INSERT OR IGNORE INTO instagram_feeds
           (id, category_id, username, display_name, profile_url, fetch_interval, last_fetched, last_max_id, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        instagram_feeds
    )

    # Insert seed data for instagram_feed_tag_map
    instagram_feed_tag_mappings = [
        (1, 2),  # openai -> Python (assuming tag id 2 is Python from existing tags)
        (1, 5),  # openai -> Startups
        (2, 5)   # ycombinator -> Startups
    ]
    cursor.executemany(
        "INSERT OR IGNORE INTO instagram_feed_tag_map (instagram_feed_id, tag_id) VALUES (?, ?)",
        instagram_feed_tag_mappings
    )

    # Insert seed data for reddit_feeds
    reddit_feeds = [
        (1, 2, "python", "Python Community", "Programming discussions about Python"),
        (2, 2, "artificial", "Artificial Intelligence", "AI news and discussions"),
        (3, 3, "cryptocurrency", "Cryptocurrency", "Crypto market and tech discussions")
    ]
    cursor.executemany(
        """INSERT OR IGNORE INTO reddit_feeds
           (id, category_id, subreddit, display_name, description)
           VALUES (?, ?, ?, ?, ?)""",
        reddit_feeds
    )

    conn.commit()
    conn.close()
    print(f"✅ Database initialized at {DATABASE_PATH}")

    # Run migration for new columns
    add_image_columns()
    add_translation_columns()
    add_approval_columns()


def add_el_comercio_tables():
    """Add El Comercio scraping tables."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Table 1: Feed configuration
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS el_comercio_feeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            url TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            section TEXT NOT NULL,
            fetch_interval INTEGER DEFAULT 60,
            last_fetched TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)

    # Table 2: Scraped articles
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS el_comercio_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            el_comercio_feed_id INTEGER NOT NULL,
            url TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            published_at TEXT,
            section TEXT DEFAULT 'gastronomia',
            image_url TEXT,
            excerpt TEXT,
            language TEXT DEFAULT 'es',
            source TEXT DEFAULT 'elcomercio',
            collected_at TEXT DEFAULT CURRENT_TIMESTAMP,
            title_translated TEXT,
            excerpt_translated TEXT,
            detected_language TEXT,
            translation_status TEXT DEFAULT 'pending',
            translated_at TEXT,
            approval_status TEXT DEFAULT 'pending',
            approved_by TEXT,
            approved_at TEXT,
            approval_notes TEXT,
            FOREIGN KEY (el_comercio_feed_id) REFERENCES el_comercio_feeds(id) ON DELETE CASCADE
        )
    """)

    # Table 3: Tag mapping
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS el_comercio_feed_tag_map (
            el_comercio_feed_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (el_comercio_feed_id, tag_id),
            FOREIGN KEY (el_comercio_feed_id) REFERENCES el_comercio_feeds(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES feed_tags(id) ON DELETE CASCADE
        )
    """)

    # Table 4: Fetch logs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS el_comercio_fetch_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            el_comercio_feed_id INTEGER NOT NULL,
            fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT,
            post_count INTEGER,
            error_message TEXT,
            FOREIGN KEY (el_comercio_feed_id) REFERENCES el_comercio_feeds(id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()
    print("✅ El Comercio tables created")


def add_diario_correo_tables():
    """Add Diario Correo scraping tables."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Table 1: Feed configuration
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS diario_correo_feeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            url TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            section TEXT NOT NULL,
            fetch_interval INTEGER DEFAULT 60,
            last_fetched TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)

    # Table 2: Scraped articles
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS diario_correo_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            diario_correo_feed_id INTEGER NOT NULL,
            url TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            published_at TEXT,
            section TEXT DEFAULT 'gastronomia',
            image_url TEXT,
            excerpt TEXT,
            language TEXT DEFAULT 'es',
            source TEXT DEFAULT 'diariocorreo',
            collected_at TEXT DEFAULT CURRENT_TIMESTAMP,
            title_translated TEXT,
            excerpt_translated TEXT,
            detected_language TEXT,
            translation_status TEXT DEFAULT 'pending',
            translated_at TEXT,
            approval_status TEXT DEFAULT 'pending',
            approved_by TEXT,
            approved_at TEXT,
            approval_notes TEXT,
            FOREIGN KEY (diario_correo_feed_id) REFERENCES diario_correo_feeds(id) ON DELETE CASCADE
        )
    """)

    # Table 3: Tag mapping
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS diario_correo_feed_tag_map (
            diario_correo_feed_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (diario_correo_feed_id, tag_id),
            FOREIGN KEY (diario_correo_feed_id) REFERENCES diario_correo_feeds(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES feed_tags(id) ON DELETE CASCADE
        )
    """)

    # Table 4: Fetch logs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS diario_correo_fetch_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            diario_correo_feed_id INTEGER NOT NULL,
            fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT,
            post_count INTEGER,
            error_message TEXT,
            FOREIGN KEY (diario_correo_feed_id) REFERENCES diario_correo_feeds(id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()
    print("✅ Diario Correo tables created")


def add_youtube_tables():
    """Add YouTube feed tables."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS youtube_feeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            channel_id TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            channel_url TEXT,
            fetch_interval INTEGER DEFAULT 60,
            last_fetched TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS youtube_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            youtube_feed_id INTEGER NOT NULL,
            video_id TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            published_at TEXT,
            channel_id TEXT,
            channel_title TEXT,
            thumbnail_url TEXT,
            video_url TEXT,
            collected_at TEXT DEFAULT CURRENT_TIMESTAMP,
            approval_status TEXT DEFAULT 'approved',
            approved_by TEXT,
            approved_at TEXT,
            approval_notes TEXT,
            FOREIGN KEY (youtube_feed_id) REFERENCES youtube_feeds(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS youtube_fetch_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            youtube_feed_id INTEGER NOT NULL,
            fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT,
            post_count INTEGER,
            max_results INTEGER,
            error_message TEXT,
            FOREIGN KEY (youtube_feed_id) REFERENCES youtube_feeds(id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()
    print("✅ YouTube tables created")


def add_youtube_transcript_columns():
    """Add transcript columns to youtube_posts table."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    def column_exists(table_name, column_name):
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [row[1] for row in cursor.fetchall()]
        return column_name in columns

    if not column_exists('youtube_posts', 'transcript'):
        cursor.execute("ALTER TABLE youtube_posts ADD COLUMN transcript TEXT")
    if not column_exists('youtube_posts', 'transcript_status'):
        cursor.execute("ALTER TABLE youtube_posts ADD COLUMN transcript_status TEXT")
    if not column_exists('youtube_posts', 'transcript_error'):
        cursor.execute("ALTER TABLE youtube_posts ADD COLUMN transcript_error TEXT")
    if not column_exists('youtube_posts', 'transcript_extracted_at'):
        cursor.execute("ALTER TABLE youtube_posts ADD COLUMN transcript_extracted_at TEXT")

    conn.commit()
    conn.close()
    print("✅ YouTube transcript columns added")


if __name__ == "__main__":
    init_database()
    add_el_comercio_tables()
    add_diario_correo_tables()
    add_youtube_tables()
    add_youtube_transcript_columns()
