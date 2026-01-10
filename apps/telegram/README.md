# Telegram User Service

Async FastAPI microservice that connects to a personal Telegram user account via Telethon and exposes read-only data.

## Setup

1) Create a virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2) Configure environment variables:

```bash
cp .env.example .env
```

3) Run the service:

```bash
python3 -m uvicorn app.main:app --reload --port 8001
```

## Environment Variables

- `TELEGRAM_API_ID` (required)
- `TELEGRAM_API_HASH` (required)
- `TELEGRAM_PHONE` (required)
- `TELEGRAM_SESSION_NAME` (optional, default `telegram_user.session`)

## First-Time Login Flow

1) Request a login code (sent to your Telegram app or SMS):

```bash
curl -X POST http://127.0.0.1:8001/telegram/login/request
```

2) Confirm the login with the code (and optional 2FA password):

```bash
curl -X POST http://127.0.0.1:8001/telegram/login/confirm \
  -H "Content-Type: application/json" \
  -d '{"code": "12345", "password": "optional-2fa"}'
```

Once authorized, the session is persisted and reused on restarts.

## Session Persistence

- Telethon session files are stored in `sessions/` (created automatically).
- `sessions/` is git-ignored and must never be committed.
- Mount `sessions/` as a persistent volume when running in Docker.

## Local Data Storage

- Approved chats and media are stored in `data/` (created automatically).
- `data/` is git-ignored and should be persisted if you want approvals and images
  to survive restarts.

## Endpoints

- `GET /telegram/status` - Check if the Telegram session is authorized.
- `POST /telegram/approved-chats` - Approve a channel/group by id.
- `GET /telegram/approved-chats` - List approved channels/groups.
- `DELETE /telegram/approved-chats/{chat_id}` - Remove an approved channel/group.
- `GET /telegram/approved-chats/{chat_id}/posts?limit=10` - Fetch latest posts for an approved chat.
- `GET /telegram/media/{file_name}` - Serve stored chat images.
- `GET /telegram/channels` - List accessible channels/groups.
- `GET /telegram/channels/{channel_id}/posts?limit=10` - Fetch latest posts (requires approval).
- `POST /telegram/login/request` - Send login code (temporary endpoint).
- `POST /telegram/login/confirm` - Confirm login with code (temporary endpoint).
- `GET /health` - Service health check.

## Docker

Build and run with a persistent sessions volume:

```bash
docker build -t telegram-user-service .

docker run --rm \
  -p 8001:8000 \
  --env-file .env \
  -v "$(pwd)/sessions:/app/sessions" \
  telegram-user-service
```
