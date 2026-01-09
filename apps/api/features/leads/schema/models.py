from typing import Optional
from pydantic import BaseModel


class LeadCreate(BaseModel):
    feed_id: int
    guid: Optional[str] = None
    title: str
    link: str
    author: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    published: Optional[str] = None


class LeadUpdate(BaseModel):
    guid: Optional[str] = None
    title: Optional[str] = None
    link: Optional[str] = None
    author: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    published: Optional[str] = None


class LeadResponse(BaseModel):
    id: int
    feed_id: int
    guid: Optional[str] = None
    title: str
    link: str
    author: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    published: Optional[str] = None
    collected_at: str
