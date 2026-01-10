from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from features.telegram.api.routes import router as telegram_router
from features.telegram.service.client import TelegramService

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    service = TelegramService.from_env()
    await service.connect()
    app.state.telegram_service = service
    try:
        yield
    finally:
        await service.disconnect()


app = FastAPI(title="Telegram User Service", lifespan=lifespan)

media_root = Path(__file__).resolve().parents[1] / "data" / "media"
media_root.mkdir(parents=True, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/telegram/media", StaticFiles(directory=media_root), name="telegram-media")
app.include_router(telegram_router)


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok"}
