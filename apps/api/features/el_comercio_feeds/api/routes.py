"""
FastAPI routes for El Comercio feeds.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict

from features.el_comercio_feeds.schema.models import (
    ElComercioFeedCreate,
    ElComercioFeedUpdate,
    ElComercioFeedResponse,
    ElComercioPostResponse
)
from features.el_comercio_feeds.service.fetcher import (
    fetch_el_comercio_feed,
    fetch_all_active_el_comercio_feeds,
    fetch_one,
    fetch_all,
    execute_query
)

router = APIRouter(prefix="/el-comercio-feeds", tags=["el-comercio-feeds"])


# Feed CRUD Operations

@router.post("", response_model=ElComercioFeedResponse, status_code=201)
def create_feed(feed: ElComercioFeedCreate):
    """Create a new El Comercio feed."""
    try:
        feed_id = execute_query(
            """INSERT INTO el_comercio_feeds
               (category_id, url, display_name, section, fetch_interval, is_active)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (feed.category_id, feed.url, feed.display_name, feed.section,
             feed.fetch_interval, feed.is_active)
        )
        created = fetch_one("SELECT * FROM el_comercio_feeds WHERE id = ?", (feed_id,))
        if not created:
            raise HTTPException(status_code=500, detail="Failed to create feed")
        return ElComercioFeedResponse(**created)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posts", response_model=List[ElComercioPostResponse])
def get_posts(
    search: Optional[str] = Query(None),
    el_comercio_feed_id: Optional[int] = Query(None),
    approval_status: Optional[str] = Query(None),
    limit: Optional[int] = Query(15, ge=1, le=100),
    offset: Optional[int] = Query(0, ge=0)
):
    """
    Get El Comercio posts with filters.

    Args:
        search: Search in title and excerpt
        el_comercio_feed_id: Filter by feed ID
        approval_status: Filter by approval status (pending, approved, rejected)
        limit: Max results (default 15, max 100)
        offset: Pagination offset
    """
    query = """
        SELECT * FROM el_comercio_posts
        WHERE 1=1
    """
    params = []

    if search:
        query += " AND (title LIKE ? OR excerpt LIKE ?)"
        search_term = f"%{search}%"
        params.extend([search_term, search_term])

    if el_comercio_feed_id is not None:
        query += " AND el_comercio_feed_id = ?"
        params.append(el_comercio_feed_id)

    if approval_status:
        query += " AND approval_status = ?"
        params.append(approval_status)

    query += " ORDER BY published_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    posts = fetch_all(query, tuple(params))
    return [ElComercioPostResponse(**p) for p in posts]


@router.get("", response_model=List[ElComercioFeedResponse])
def get_feeds(
    category_id: Optional[int] = Query(None),
    is_active: Optional[int] = Query(None),
    limit: Optional[int] = Query(None, ge=1),
    offset: Optional[int] = Query(0, ge=0)
):
    """Get all El Comercio feeds with optional filters."""
    query = "SELECT * FROM el_comercio_feeds WHERE 1=1"
    params = []

    if category_id is not None:
        query += " AND category_id = ?"
        params.append(category_id)

    if is_active is not None:
        query += " AND is_active = ?"
        params.append(is_active)

    query += " ORDER BY created_at DESC"

    if limit is not None:
        query += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])

    feeds = fetch_all(query, tuple(params))
    return [ElComercioFeedResponse(**f) for f in feeds]


@router.get("/{feed_id}", response_model=ElComercioFeedResponse)
def get_feed(feed_id: int):
    """Get a single El Comercio feed by ID."""
    feed = fetch_one("SELECT * FROM el_comercio_feeds WHERE id = ?", (feed_id,))
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    return ElComercioFeedResponse(**feed)


@router.put("/{feed_id}", response_model=ElComercioFeedResponse)
def update_feed(feed_id: int, feed: ElComercioFeedUpdate):
    """Update an El Comercio feed."""
    existing = fetch_one("SELECT * FROM el_comercio_feeds WHERE id = ?", (feed_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Feed not found")

    # Build update query dynamically based on provided fields
    update_fields = []
    params = []

    if feed.category_id is not None:
        update_fields.append("category_id = ?")
        params.append(feed.category_id)
    if feed.url is not None:
        update_fields.append("url = ?")
        params.append(feed.url)
    if feed.display_name is not None:
        update_fields.append("display_name = ?")
        params.append(feed.display_name)
    if feed.section is not None:
        update_fields.append("section = ?")
        params.append(feed.section)
    if feed.fetch_interval is not None:
        update_fields.append("fetch_interval = ?")
        params.append(feed.fetch_interval)
    if feed.is_active is not None:
        update_fields.append("is_active = ?")
        params.append(feed.is_active)

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    params.append(feed_id)
    query = f"UPDATE el_comercio_feeds SET {', '.join(update_fields)} WHERE id = ?"

    try:
        execute_query(query, tuple(params))
        updated = fetch_one("SELECT * FROM el_comercio_feeds WHERE id = ?", (feed_id,))
        return ElComercioFeedResponse(**updated)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{feed_id}", status_code=204)
def delete_feed(feed_id: int):
    """Delete an El Comercio feed and all associated posts."""
    existing = fetch_one("SELECT * FROM el_comercio_feeds WHERE id = ?", (feed_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Feed not found")

    try:
        execute_query("DELETE FROM el_comercio_feeds WHERE id = ?", (feed_id,))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{feed_id}/activate", response_model=ElComercioFeedResponse)
def activate_feed(feed_id: int):
    """Activate an El Comercio feed."""
    existing = fetch_one("SELECT * FROM el_comercio_feeds WHERE id = ?", (feed_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Feed not found")

    try:
        execute_query("UPDATE el_comercio_feeds SET is_active = 1 WHERE id = ?", (feed_id,))
        updated = fetch_one("SELECT * FROM el_comercio_feeds WHERE id = ?", (feed_id,))
        return ElComercioFeedResponse(**updated)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{feed_id}/deactivate", response_model=ElComercioFeedResponse)
def deactivate_feed(feed_id: int):
    """Deactivate an El Comercio feed."""
    existing = fetch_one("SELECT * FROM el_comercio_feeds WHERE id = ?", (feed_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Feed not found")

    try:
        execute_query("UPDATE el_comercio_feeds SET is_active = 0 WHERE id = ?", (feed_id,))
        updated = fetch_one("SELECT * FROM el_comercio_feeds WHERE id = ?", (feed_id,))
        return ElComercioFeedResponse(**updated)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Fetch Operations

@router.post("/{feed_id}/fetch", response_model=Dict)
def trigger_fetch(feed_id: int):
    """
    Manually trigger scrape for a specific feed.

    IMPORTANT: This endpoint BLOCKS for 10-30 seconds while scraping.
    The scraper will delete all existing posts and insert fresh 15 articles.
    """
    existing = fetch_one("SELECT * FROM el_comercio_feeds WHERE id = ?", (feed_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Feed not found")

    try:
        result = fetch_el_comercio_feed(feed_id)
        return {
            "el_comercio_feed_id": feed_id,
            "display_name": existing["display_name"],
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fetch-all", response_model=List[Dict])
def trigger_fetch_all():
    """
    Trigger fetch for all active El Comercio feeds.

    IMPORTANT: This endpoint BLOCKS while scraping all feeds.
    """
    try:
        results = fetch_all_active_el_comercio_feeds()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posts/{post_id}", response_model=ElComercioPostResponse)
def get_post(post_id: int):
    """Get a single El Comercio post by ID."""
    post = fetch_one("SELECT * FROM el_comercio_posts WHERE id = ?", (post_id,))
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return ElComercioPostResponse(**post)


@router.delete("/posts/{post_id}", status_code=204)
def delete_post(post_id: int):
    """Delete an El Comercio post."""
    existing = fetch_one("SELECT * FROM el_comercio_posts WHERE id = ?", (post_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")

    try:
        execute_query("DELETE FROM el_comercio_posts WHERE id = ?", (post_id,))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
