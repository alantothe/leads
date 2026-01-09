from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from features.feed.api.routes import router as feed_router
from features.categories.api.routes import router as categories_router
from features.feeds.api.routes import router as feeds_router
from features.tags.api.routes import router as tags_router
from features.leads.api.routes import router as leads_router
from features.fetch_logs.api.routes import router as fetch_logs_router
from features.dev.api.routes import router as dev_router

app = FastAPI(title="RSS Leads API")

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
app.include_router(dev_router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
