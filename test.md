“Here is a detailed SQLite schema tailored for an RSS leads app that may contain hundreds of feeds organized by categories and tags, with lead tracking, deduping, and fetch history. Please install SQLite and add these tables and rows. Add routes that will let me create, update, get, and delete. Also, add a frontend with pages and UI that will let us talk to our server and hit the endpoints so we can see and create our database. 

---

## 📌 Database Tables

### 1. `categories`

Stores feed groups (1 feed belongs to 1 category)

```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);
```

**Example rows**

| id | name   | description                  |
| -- | ------ | ---------------------------- |
| 1  | Jobs   | Remote job listings          |
| 2  | AI     | Artificial intelligence news |
| 3  | Crypto | Blockchain & market feeds    |

---

### 2. `feeds`

Stores RSS feed sources

```sql
CREATE TABLE feeds (
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
);
```

**Example rows**

| id | category_id | url                                                              | source_name    | website            | fetch_interval | last_fetched        | is_active |
| -- | ----------- | ---------------------------------------------------------------- | -------------- | ------------------ | -------------- | ------------------- | --------- |
| 1  | 1           | [https://weworkremotely.com/rss](https://weworkremotely.com/rss) | WeWorkRemotely | weworkremotely.com | 15             | 2026-01-07 10:00:00 | 1         |
| 2  | 2           | [https://openai.com/blog/rss](https://openai.com/blog/rss)       | OpenAI Blog    | openai.com         | 60             | 2026-01-06 18:22:11 | 1         |
| 3  | 3           | [https://cointelegraph.com/rss](https://cointelegraph.com/rss)   | CoinTelegraph  | cointelegraph.com  | 20             | 2026-01-07 09:15:00 | 1         |

---

### 3. `feed_tags`

Allows **multiple tags per feed** (Python, Remote, Senior, etc)

```sql
CREATE TABLE feed_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE feed_tag_map (
    feed_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (feed_id, tag_id),
    FOREIGN KEY (feed_id) REFERENCES feeds(id),
    FOREIGN KEY (tag_id) REFERENCES feed_tags(id)
);
```

**Example tag rows**

| id | name     |
| -- | -------- |
| 1  | Remote   |
| 2  | Python   |
| 3  | Senior   |
| 4  | DeFi     |
| 5  | Startups |

**Example mappings**

| feed_id | tag_id |
| ------- | ------ |
| 1       | 1      |
| 1       | 2      |
| 1       | 3      |
| 3       | 4      |

---

### 4. `leads`

Stores parsed items from RSS feeds

```sql
CREATE TABLE leads (
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
);
```

**Example rows**

| id | feed_id | guid           | title             | link                                                 | author | summary            | published  |
| -- | ------- | -------------- | ----------------- | ---------------------------------------------------- | ------ | ------------------ | ---------- |
| 1  | 1       | job-123abc     | Senior Python Dev | [https://example.com/job1](https://example.com/job1) | John   | Remote Python role | 2026-01-07 |
| 2  | 1       | job-999xyz     | ML Engineer       | [https://example.com/job2](https://example.com/job2) | Sarah  | AI startup hiring  | 2026-01-06 |
| 3  | 2       | openai-post-55 | GPT-5 Launch      | [https://example.com/post](https://example.com/post) | OpenAI | New model released | 2026-01-05 |

---

### 5. `fetch_logs`

Tracks every feed fetch attempt (good for monitoring scale)

```sql
CREATE TABLE fetch_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feed_id INTEGER NOT NULL,
    fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT,
    lead_count INTEGER,
    error_message TEXT,
    FOREIGN KEY (feed_id) REFERENCES feeds(id)
);
```

**Example rows**

| id | feed_id | fetched_at          | status  | lead_count | error_message |
| -- | ------- | ------------------- | ------- | ---------- | ------------- |
| 1  | 1       | 2026-01-07 10:00:00 | SUCCESS | 22         | NULL          |
| 2  | 2       | 2026-01-07 10:00:01 | FAILED  | 0          | Timeout       |
| 3  | 3       | 2026-01-07 10:00:01 | SUCCESS | 5          | NULL          |

---

## 🧠 Why this schema works

✔ One feed → One category
✔ One feed → Many tags (via mapping table)
✔ Leads dedupe using `guid` or fallback unique index
✔ You can query leads by category or tag later
✔ Fetch history lets you scale without losing control

---

## 🔍 Useful Queries for later

### Get all active feed URLs by category

```sql
SELECT f.id, f.url, c.name as category
FROM feeds f
JOIN categories c ON f.category_id = c.id
WHERE f.is_active = 1 AND c.name = "Jobs";
```

### Get leads from a category

```sql
SELECT l.title, l.link, l.published, c.name
FROM leads l
JOIN feeds f ON l.feed_id = f.id
JOIN categories c ON f.category_id = c.id
WHERE c.name = "AI"
ORDER BY l.published DESC;
```

### Get leads that match a tag

```sql
SELECT l.title, l.link, t.name
FROM leads l
JOIN feeds f ON l.feed_id = f.id
JOIN feed_tag_map m ON f.id = m.feed_id
JOIN feed_tags t ON m.tag_id = t.id
WHERE t.name = "Remote";
```

---

## 📎 Suggested Python structure to match DB

```python
DATABASE = "leads.db"

def get_feeds():
    return db.execute("""
        SELECT id, url, category_id FROM feeds WHERE is_active = 1
    """).fetchall()
```

Then fetch **concurrently**, process **one by one**, store leads with the `feed_id`.

---


Got it — extending the plan to include **expected API parameters and request body shapes** for each CRUD route.

---

## 1. Categories

### `POST /categories`

**req.body**

```json
{
  "name": "string (unique)",
  "description": "string | null"
}
```

### `GET /categories`

**query params (optional filters)**

```
?limit=number
?offset=number
```

### `PUT /categories/:id`

**params**

```
id → category ID
```

**req.body**

```json
{
  "name": "string (unique, no collision)",
  "description": "string | null"
}
```

### `DELETE /categories/:id`

**params**

```
id → category ID
```

**Policy:** deny if feeds exist OR cascade-deactivate feeds.

---

## 2. Feeds

### `POST /feeds`

**req.body**

```json
{
  "category_id": "number (must exist)",
  "url": "string (unique RSS URL)",
  "source_name": "string",
  "website": "string | null",
  "fetch_interval": "number (minutes)",
  "is_active": "0 | 1 (optional)"
}
```

### `GET /feeds`

**query params**

```
?active=0|1
?category_id=number
?limit=number
?offset=number
```

### `PUT /feeds/:id`

**params**

```
id → feed ID
```

**req.body**

```json
{
  "category_id": "number (must exist)",
  "url": "string (unique, optional if unchanged)",
  "source_name": "string (optional)",
  "website": "string | null",
  "fetch_interval": "number (optional)",
  "is_active": "0 | 1 (optional)",
  "last_fetched": "timestamp string (optional)"
}
```

### `PATCH /feeds/:id/activate`

**params**

```
id → feed ID
```

**req.body:** empty (just flips active flag)

### `PATCH /feeds/:id/deactivate`

**params**

```
id → feed ID
```

**req.body:** empty (soft delete behavior)

### `GET /feeds/category/:category_id`

**params**

```
category_id → number
```

---

## 3. Tags

### `POST /tags`

**req.body**

```json
{
  "name": "string (unique)"
}
```

### `PUT /tags/:id`

**params**

```
id → tag ID
```

**req.body**

```json
{
  "name": "string (unique, no collision)"
}
```

### `DELETE /tags/:id`

**params**

```
id → tag ID
```

**Policy:** block if mapped OR cascade-unmap.

### `GET /tags`

No body, returns list for UI.

---

## 4. Feed ↔ Tag Mapping

### `POST /feeds/:feed_id/tags/:tag_id`

**params**

```
feed_id → number (must exist)
tag_id → number (must exist)
```

**req.body:** empty (creates row in `feed_tag_map`)

### `GET /feeds/:feed_id/tags`

**params**

```
feed_id → number
```

### `DELETE /feeds/:feed_id/tags/:tag_id`

**params**

```
feed_id → number
tag_id → number
```

### `PUT /feeds/:feed_id/tags` (bulk replace)

**params**

```
feed_id → number
```

**req.body**

```json
{
  "tags": [1, 2, 3]  // array of tag IDs
}
```

---

## 5. Leads

### `POST /leads`

**req.body**

```json
{
  "feed_id": "number (must exist)",
  "guid": "string (unique or null if generated)",
  "title": "string",
  "link": "string (URL)",
  "author": "string | null",
  "summary": "string | null",
  "content": "string | null",
  "published": "timestamp string | null"
}
```

### `GET /leads`

**query params**

```
?feed_id=number
?search="text"
?limit=number
?offset=number
?category="Jobs" | "AI" | "Crypto"
?tag="Remote" | "Python" | etc
?sort=published|collected_at
```

### `GET /leads/:id`

**params**

```
id → lead ID
```

### `GET /leads/feed/:feed_id`

**params**

```
feed_id → number
```

### `GET /leads/tag/:tag_name`

**params**

```
tag_name → string
```

### `GET /leads/category/:category_name`

**params**

```
category_name → string
```

### `PUT /leads/:id`

**params**

```
id → lead ID
```

**req.body**

```json
{
  "guid": "string (optional if unchanged)",
  "title": "string (optional)",
  "link": "string (optional)",
  "author": "string | null",
  "summary": "string | null",
  "content": "string | null",
  "published": "timestamp string | null"
}
```

### `DELETE /leads/:id`

**params**

```
id → lead ID
```

Hard delete is fine.

---

## 6. Fetch Logs

### `GET /logs`

**query params**

```
?feed_id=number
?status=SUCCESS|FAILED
?limit=number
?offset=number
?sort=fetched_at
```

### `GET /logs/feed/:feed_id`

**params**

```
feed_id → number
```

### `DELETE /logs/:id` (optional admin cleanup)

**params**

```
id → log ID
```

**Logs are system-generated, not manually created from API.**

---

## Summary of Param vs Body Usage

| Table        | Uses URL Params?                                 | Uses Body?            |
| ------------ | ------------------------------------------------ | --------------------- |
| categories   | `:id`, filters                                   | create + update       |
| feeds        | `:id`, `:category_id`                            | create + update       |
| tags         | `:id`                                            | create + rename       |
| feed_tag_map | `:feed_id`, `:tag_id`                            | bulk replace optional |
| leads        | `:id`, `:feed_id`, `:tag_name`, `:category_name` | create + update       |
| fetch_logs   | `:id`, `:feed_id`, filters                       | rarely                |

---


