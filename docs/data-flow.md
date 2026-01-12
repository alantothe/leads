# Data Flow Map

This document explains how data moves through the UI, APIs, microservices, and storage.
It is detailed but intentionally simple to scan.

## High-level graph

```mermaid
flowchart LR
  UI[React UI<br/>apps/client] -->|HTTP JSON| API[Main FastAPI<br/>:8000]
  API --> DB[(SQLite<br/>apps/api/leads.db)]

  API -->|/feed?url=| FeedParse[RSS Parse-only]
  FeedParse --> RSS[RSS/Atom URLs]

  API -->|/feeds/*/fetch| FeedFetch[RSS Fetch + Leads]
  FeedFetch --> RSS
  FeedFetch --> DB

  API -->|/instagram-feeds/*/fetch| InstaFetch[Instagram Fetch]
  InstaFetch --> RapidAPI[RapidAPI Instagram]
  InstaFetch --> DB

  API -->|/telegram/*| TelegramSvc[Telegram Service]
  TelegramSvc --> TelegramAPI[Telegram API]
  TelegramSvc --> DB
  TelegramSvc --> Media[/telegram/media files]

  TelegramMS[Telegram FastAPI<br/>:8001] --> TelegramSvc
```

Notes:
- The main API exposes `/subreddits` and `/telegram/*` and can serve them on port 8000.
- Telegram can also run as a dedicated service on 8001.
- All services share the same SQLite database at `apps/api/leads.db`.

## Services and entrypoints (dev)

- Main API: `apps/api/app/main.py` on `http://localhost:8000`
- Telegram service: `apps/telegram/app/main.py` on `http://localhost:8001`
- Frontend: `apps/client` on `http://localhost:5173`

## Shared data stores

- SQLite DB: `apps/api/leads.db`
  - Schema created by `apps/api/lib/database/init_db.py`.
  - Used by the main API plus the Telegram service.
- Telegram media: `apps/telegram/data/media`
  - Image files downloaded from Telegram and served at `/telegram/media/*`.
- Telegram sessions: `apps/telegram/sessions`
  - Telethon session files persisted between restarts.

## Frontend data flow

Frontend code lives in `apps/client`.
The API client is `apps/client/src/api.js` with `API_BASE = http://localhost:8000`.

### Dashboard page (`apps/client/src/pages/Dashboard.jsx`)
1) UI calls `GET /categories`, `GET /feeds`, `GET /tags`, and `GET /leads?limit=1`.
2) Backend returns counts; UI calculates summary stats.
3) UI displays counts and navigation links.

### Feeds page (`apps/client/src/pages/Feeds.jsx`)
1) UI loads feeds, categories, and tags.
2) Create/edit feed -> `POST /feeds` or `PUT /feeds/{id}`.
3) Toggle active -> `PATCH /feeds/{id}/activate|deactivate`.
4) Fetch now -> `POST /feeds/{id}/fetch` or `POST /feeds/fetch-all`.

### Instagram feeds/posts (`apps/client/src/pages/InstagramFeeds.jsx`)
1) UI loads feeds -> `GET /instagram-feeds`.
2) Create/edit -> `POST /instagram-feeds` or `PUT /instagram-feeds/{id}`.
3) Fetch now -> `POST /instagram-feeds/{id}/fetch` or `POST /instagram-feeds/fetch-all`.
4) Posts view -> `GET /instagram-feeds/posts`.

### Subreddits (`apps/client/src/pages/Subreddits.jsx`)
1) UI loads subreddits -> `GET /subreddits`.
2) Create/edit -> `POST /subreddits` or `PUT /subreddits/{id}`.
3) Delete -> `DELETE /subreddits/{id}`.

### Categories, Tags, Leads, Logs pages
Each page maps directly to the related REST endpoints in `apps/api/features/*/api/routes.py`.

### Subreddits/Telegram in UI
Subreddits are managed through `/subreddits`.
Telegram endpoints are available for API use, but not wired into React.

## Backend data flow (main API)

### Core DB helpers
All core routes use `apps/api/lib/database/db.py` for SQLite access.

### Categories
Endpoints: `apps/api/features/categories/api/routes.py`
1) UI or API client calls `POST /categories`.
2) Server inserts row into `categories`.
3) Returns `CategoryResponse`.

### Feeds (RSS sources)
Endpoints: `apps/api/features/feeds/api/routes.py`
1) Create feed -> `INSERT INTO feeds` with category validation.
2) Fetch feeds -> `SELECT * FROM feeds` plus tag join via `feed_tag_map`.
3) Activate/deactivate -> updates `feeds.is_active`.

### RSS parsing (no DB write)
Endpoint: `GET /feed?url=...`
1) URL validated in `apps/api/utils/validation.py`.
2) Parsed by `apps/api/features/feed/service/parser.py` (feedparser).
3) Returns metadata + entries without storing to DB.

### RSS fetch -> leads
Endpoint: `POST /feeds/{id}/fetch` and `POST /feeds/fetch-all`
1) Load feed row by id.
2) Parse RSS at `feeds.url`.
3) For each entry, dedupe by `(feed_id, guid)` and insert into `leads`.
4) Update `feeds.last_fetched`.
5) Insert into `fetch_logs` with status and counts.

### Leads
Endpoints: `apps/api/features/leads/api/routes.py`
1) `GET /leads` builds SQL joins for category/tag filters.
2) Results come from the `leads` table plus joins to `feeds`, `categories`,
   and `feed_tag_map` as needed.

### Tags and feed-tag mapping
Endpoints: `apps/api/features/tags/api/routes.py`
1) Tags live in `feed_tags`.
2) Feed associations live in `feed_tag_map`.
3) Bulk update replaces mappings by deleting all and re-inserting.

### Fetch logs
Endpoints: `apps/api/features/fetch_logs/api/routes.py`
1) Logs live in `fetch_logs`.
2) Reads are filtered by feed_id or status, sorted by `fetched_at`.

### Dev cleanup
Endpoints: `apps/api/features/dev/api/routes.py`
1) `DELETE /dev/clear-all` wipes categories, feeds, tags, leads, logs.
2) `DELETE /dev/clear-fetched` wipes leads + logs only.

### Subreddits
Endpoints: `apps/api/features/subreddits/api/routes.py`
1) Validate subreddit inputs in `apps/api/utils/validation.py`.
2) Store list entries in `reddit_feeds`.
3) Read lists and details directly from `reddit_feeds`.

## Instagram flow (main API)

Endpoints: `apps/api/features/instagram_feeds/api/routes.py`

1) Fetch triggered via `POST /instagram-feeds/{id}/fetch` or `/fetch-all`.
2) `fetch_instagram_feed` calls RapidAPI in
   `apps/api/features/instagram_feeds/service/instagram_client.py`.
3) Posts parsed into `InstagramPost` models.
4) Deduped on `instagram_posts.post_id`.
5) Insert into `instagram_posts` and log into `instagram_fetch_logs`.
6) Update `instagram_feeds.last_fetched` and `last_max_id` for pagination.

## Telegram flow (shared module + optional service)

Endpoints: `apps/telegram/features/telegram/api/routes.py`

### Auth & session
1) `POST /telegram/login/request` sends SMS/app code via Telethon.
2) `POST /telegram/login/confirm` completes auth (optional 2FA).
3) Session is stored in `apps/telegram/sessions`.

### Approved chats
1) `POST /telegram/approved-chats` validates chat_id, fetches summary.
2) Chat is stored in `telegram_feeds` with `is_active = 1`.
3) `GET /telegram/approved-chats` reads from `telegram_feeds`.

### Fetch posts into DB
1) `POST /telegram/feeds/{chat_id}/fetch` triggers fetch.
2) Service connects via Telethon and loads posts.
3) Deduped on `(telegram_feed_id, message_id)` in `telegram_posts`.
4) Logs written to `telegram_fetch_logs`.
5) `telegram_feeds.last_fetched` updated.

### Media download and serving
1) Image messages are downloaded and resized if needed.
2) Stored at `apps/telegram/data/media`.
3) Served via `/telegram/media/{file_name}`.

## Table map (which feature writes where)

- Categories: `categories`
- RSS feeds: `feeds`, `feed_tag_map`
- RSS leads: `leads`, `fetch_logs`
- Instagram feeds: `instagram_feeds`, `instagram_feed_tag_map`
- Instagram posts/logs: `instagram_posts`, `instagram_fetch_logs`
- Subreddits: `reddit_feeds`
- Telegram feeds/posts/logs: `telegram_feeds`, `telegram_posts`, `telegram_fetch_logs`

## Operational notes

- Fetch intervals are stored in DB but no scheduler exists in code.
  Fetching is manual via API calls or an external cron.
- The UI uses the main API at port 8000; Telegram endpoints are
  available but not yet used by the UI.
