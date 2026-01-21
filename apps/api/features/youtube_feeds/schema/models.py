from typing import List, Optional
from pydantic import BaseModel


class YouTubeFeedCreate(BaseModel):
    category_id: int
    channel_id: str
    display_name: str
    channel_url: Optional[str] = None
    fetch_interval: int = 60
    is_active: int = 1
    channel_summary: str
    primary_topics: List[str]
    audience: str
    language_region: str
    hosts: List[str]
    formats: List[str]
    tone_style: List[str]
    expertise_background: str
    credibility_bias_notes: str
    country: str


class YouTubeFeedUpdate(BaseModel):
    category_id: Optional[int] = None
    channel_id: Optional[str] = None
    display_name: Optional[str] = None
    channel_url: Optional[str] = None
    fetch_interval: Optional[int] = None
    is_active: Optional[int] = None
    last_fetched: Optional[str] = None
    channel_summary: Optional[str] = None
    primary_topics: Optional[List[str]] = None
    audience: Optional[str] = None
    language_region: Optional[str] = None
    hosts: Optional[List[str]] = None
    formats: Optional[List[str]] = None
    tone_style: Optional[List[str]] = None
    expertise_background: Optional[str] = None
    credibility_bias_notes: Optional[str] = None
    country: Optional[str] = None


class YouTubeFeedResponse(BaseModel):
    id: int
    category_id: int
    channel_id: str
    display_name: str
    channel_url: Optional[str] = None
    fetch_interval: int
    last_fetched: Optional[str] = None
    is_active: int
    created_at: str
    channel_summary: Optional[str] = None
    primary_topics: Optional[List[str]] = None
    audience: Optional[str] = None
    language_region: Optional[str] = None
    hosts: Optional[List[str]] = None
    formats: Optional[List[str]] = None
    tone_style: Optional[List[str]] = None
    expertise_background: Optional[str] = None
    credibility_bias_notes: Optional[str] = None
    country: Optional[str] = None


class YouTubePostResponse(BaseModel):
    id: int
    youtube_feed_id: int
    video_id: str
    title: str
    description: Optional[str] = None
    published_at: Optional[str] = None
    channel_id: Optional[str] = None
    channel_title: Optional[str] = None
    country: Optional[str] = None
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None
    collected_at: str
    approval_status: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    approval_notes: Optional[str] = None
    transcript: Optional[str] = None
    transcript_status: Optional[str] = None
    transcript_error: Optional[str] = None
    transcript_extracted_at: Optional[str] = None


class YouTubeVideo(BaseModel):
    video_id: str
    title: str
    description: Optional[str] = None
    published_at: Optional[str] = None
    channel_id: Optional[str] = None
    channel_title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None


class TranscriptResponse(BaseModel):
    post_id: int
    video_id: str
    transcript: Optional[str] = None
    transcript_status: Optional[str] = None
    transcript_error: Optional[str] = None
    transcript_extracted_at: Optional[str] = None
