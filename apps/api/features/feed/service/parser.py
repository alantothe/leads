from typing import Optional

import feedparser

from features.feed.schema.models import FeedEntry, FeedMeta, FeedResponse
from lib.dates import to_isoformat


def _get_field(obj, key: str) -> Optional[str]:
    if obj is None:
        return None
    if hasattr(obj, "get"):
        return obj.get(key)
    return getattr(obj, key, None)


def _entry_content(entry) -> Optional[str]:
    content = _get_field(entry, "content")
    if isinstance(content, list) and content:
        first = content[0]
        if isinstance(first, dict):
            return first.get("value")
        return getattr(first, "value", None)
    return None


def parse_feed(url: str) -> FeedResponse:
    feed = feedparser.parse(url)

    meta = FeedMeta(
        title=_get_field(feed.feed, "title"),
        link=_get_field(feed.feed, "link"),
        subtitle=_get_field(feed.feed, "subtitle")
        or _get_field(feed.feed, "description"),
        language=_get_field(feed.feed, "language"),
        updated=to_isoformat(_get_field(feed.feed, "updated_parsed")),
        published=to_isoformat(_get_field(feed.feed, "published_parsed")),
        author=_get_field(feed.feed, "author"),
    )

    entries = []
    for entry in feed.entries:
        entry_id = (
            _get_field(entry, "id")
            or _get_field(entry, "guid")
            or _get_field(entry, "link")
        )
        entries.append(
            FeedEntry(
                id=entry_id,
                title=_get_field(entry, "title"),
                link=_get_field(entry, "link"),
                summary=_get_field(entry, "summary")
                or _get_field(entry, "description"),
                content=_entry_content(entry),
                published=to_isoformat(_get_field(entry, "published_parsed")),
                updated=to_isoformat(_get_field(entry, "updated_parsed")),
                author=_get_field(entry, "author"),
            )
        )

    bozo = bool(getattr(feed, "bozo", False))
    bozo_exception = None
    if bozo:
        exception = getattr(feed, "bozo_exception", None)
        bozo_exception = str(exception) if exception else None

    return FeedResponse(
        feed=meta,
        entries=entries,
        bozo=bozo,
        bozo_exception=bozo_exception,
    )
