from typing import Optional, List
from pydantic import BaseModel

# Instagram Feed Schemas
class InstagramFeedCreate(BaseModel):
    category_id: int
    username: str
    display_name: str
    profile_url: Optional[str] = None
    fetch_interval: int = 60
    is_active: int = 1

class InstagramFeedUpdate(BaseModel):
    category_id: Optional[int] = None
    username: Optional[str] = None
    display_name: Optional[str] = None
    profile_url: Optional[str] = None
    fetch_interval: Optional[int] = None
    is_active: Optional[int] = None
    last_fetched: Optional[str] = None
    last_max_id: Optional[str] = None

class InstagramFeedResponse(BaseModel):
    id: int
    category_id: int
    username: str
    display_name: str
    profile_url: Optional[str] = None
    fetch_interval: int
    last_fetched: Optional[str] = None
    last_max_id: Optional[str] = None
    is_active: int
    created_at: str
    tags: Optional[List[str]] = []

# Instagram Post Schemas
class InstagramPostResponse(BaseModel):
    id: int
    instagram_feed_id: int
    post_id: str
    username: str
    caption: Optional[str] = None
    media_type: Optional[str] = None
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    like_count: int
    comment_count: int
    view_count: Optional[int] = None
    posted_at: Optional[str] = None
    permalink: Optional[str] = None
    collected_at: str

# Instagram API Response Models (internal)
class InstagramPost(BaseModel):
    post_id: str
    username: str
    caption: Optional[str] = None
    media_type: str
    media_url: str
    thumbnail_url: Optional[str] = None
    like_count: int = 0
    comment_count: int = 0
    view_count: Optional[int] = None
    posted_at: Optional[str] = None
    permalink: Optional[str] = None
