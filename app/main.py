from fastapi import FastAPI

from features.feed.api.routes import router as feed_router

app = FastAPI(title="Feed Parser API")
app.include_router(feed_router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
