from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import sys

# Add Telegram app to Python path
telegram_path = Path(__file__).parent.parent.parent / "telegram"
sys.path.insert(0, str(telegram_path))

from features.feed.api.routes import router as feed_router
from features.categories.api.routes import router as categories_router
from features.feeds.api.routes import router as feeds_router
from features.tags.api.routes import router as tags_router
from features.leads.api.routes import router as leads_router
from features.fetch_logs.api.routes import router as fetch_logs_router
from features.dev.api.routes import router as dev_router
from features.instagram_feeds.api.routes import router as instagram_feeds_router
from features.subreddits.api.routes import router as subreddits_router
from features.translation.api.routes import router as translation_router
from features.approval.api.routes import router as approval_router
from features.el_comercio_feeds.api.routes import router as el_comercio_feeds_router

# Import Telegram router
from features.telegram.api.routes import router as telegram_router

# Import Telegram service for lifecycle management
from features.telegram.service.client import TelegramService
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Telegram service
    try:
        telegram_service = TelegramService.from_env()
        await telegram_service.connect()
        app.state.telegram_service = telegram_service
    except Exception:
        # If Telegram env vars not configured, service won't be available
        app.state.telegram_service = None

    yield

    # Shutdown: Disconnect Telegram service
    if hasattr(app.state, "telegram_service") and app.state.telegram_service:
        await app.state.telegram_service.disconnect()


app = FastAPI(title="RSS Leads API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(categories_router)
app.include_router(feeds_router)
app.include_router(tags_router)
app.include_router(leads_router)
app.include_router(fetch_logs_router)
app.include_router(feed_router)
app.include_router(instagram_feeds_router)
app.include_router(subreddits_router)
app.include_router(translation_router)
app.include_router(telegram_router)
app.include_router(approval_router)
app.include_router(el_comercio_feeds_router)
app.include_router(dev_router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
