from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ChannelSummary(BaseModel):
    id: int = Field(..., description="Channel or group id")
    title: str
    username: Optional[str] = None
    type: str = Field(..., description="public or private")


class ChannelsResponse(BaseModel):
    channels: List[ChannelSummary]


class SenderInfo(BaseModel):
    id: Optional[int] = None
    username: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = Field(
        None, description="user, bot, channel, or group"
    )


class MediaMetadata(BaseModel):
    media_type: str
    mime_type: Optional[str] = None
    file_name: Optional[str] = None
    size: Optional[int] = None
    url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


class Post(BaseModel):
    id: int
    text: Optional[str] = None
    timestamp: datetime
    media: Optional[MediaMetadata] = None
    sender: Optional[SenderInfo] = None


class PostsResponse(BaseModel):
    channel_id: int
    posts: List[Post]


class LoginConfirmRequest(BaseModel):
    code: str = Field(..., description="Telegram login code")
    password: Optional[str] = Field(
        None, description="Telegram 2FA password if enabled"
    )


class StatusResponse(BaseModel):
    status: str
    detail: Optional[str] = None


class AuthStatusResponse(BaseModel):
    authorized: bool
    status: str = Field(..., description="authorized or unauthorized")
    detail: Optional[str] = None


class ApprovedChat(BaseModel):
    chat_id: int = Field(..., description="Channel or group id")
    title: str
    type: str = Field(..., description="public or private")


class ApprovedChatCreateRequest(BaseModel):
    chat_id: int = Field(..., description="Channel or group id")


class ApprovedChatsResponse(BaseModel):
    chats: List[ApprovedChat]


class TelegramPostResponse(BaseModel):
    """Complete response model for telegram_posts from database."""
    id: int
    telegram_feed_id: int
    message_id: int
    text: Optional[str] = None
    timestamp: str
    sender_id: Optional[int] = None
    sender_name: Optional[str] = None
    sender_username: Optional[str] = None
    sender_type: Optional[str] = None
    media_type: Optional[str] = None
    media_file_name: Optional[str] = None
    collected_at: str
    # Translation fields
    text_translated: Optional[str] = None
    detected_language: Optional[str] = None
    translation_status: Optional[str] = None
    translated_at: Optional[str] = None
    # Approval fields
    approval_status: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    approval_notes: Optional[str] = None
