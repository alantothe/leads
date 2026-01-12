from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response

from features.telegram.schema.models import (
    AuthStatusResponse,
    ApprovedChat,
    ApprovedChatCreateRequest,
    ApprovedChatsResponse,
    ChannelsResponse,
    LoginConfirmRequest,
    PostsResponse,
    StatusResponse,
)
from features.telegram.service.approved_chats import (
    ApprovedChatRecord,
    ApprovedChatStore,
)
from features.telegram.service.client import (
    TelegramAuthError,
    TelegramNotFoundError,
    TelegramRateLimitError,
    TelegramService,
    TelegramServiceError,
)
from features.telegram.service.fetcher import (
    fetch_telegram_feed,
    fetch_all_active_telegram_feeds,
)
import sqlite3
from pathlib import Path
from telegram_utils.telegram_validation import (
    InvalidChannelIdError,
    InvalidLimitError,
    validate_channel_id,
    validate_limit,
)

router = APIRouter(prefix="/telegram", tags=["telegram"])
approved_chat_store = ApprovedChatStore()


def get_telegram_service(request: Request) -> TelegramService:
    service = getattr(request.app.state, "telegram_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Telegram service unavailable.")
    return service


def _to_approved_chat(record: ApprovedChatRecord) -> ApprovedChat:
    return ApprovedChat(
        chat_id=record.chat_id,
        title=record.title,
        type=record.type,
    )


@router.post("/login/request", response_model=StatusResponse)
async def request_login_code(
    service: TelegramService = Depends(get_telegram_service),
) -> StatusResponse:
    try:
        await service.request_login_code()
    except TelegramRateLimitError as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except TelegramAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except TelegramServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return StatusResponse(status="code_sent")


@router.post("/login/confirm", response_model=StatusResponse)
async def confirm_login(
    payload: LoginConfirmRequest,
    service: TelegramService = Depends(get_telegram_service),
) -> StatusResponse:
    try:
        await service.confirm_login(payload.code, payload.password)
    except TelegramRateLimitError as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except TelegramAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except TelegramServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return StatusResponse(status="authorized")


@router.get("/status", response_model=AuthStatusResponse)
async def get_status(
    service: TelegramService = Depends(get_telegram_service),
) -> AuthStatusResponse:
    try:
        authorized = await service.is_authorized()
    except TelegramServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    status = "authorized" if authorized else "unauthorized"
    detail = None if authorized else "Telegram session is not authorized."
    return AuthStatusResponse(authorized=authorized, status=status, detail=detail)


@router.post("/approved-chats", response_model=ApprovedChat, status_code=201)
async def add_approved_chat(
    payload: ApprovedChatCreateRequest,
    response: Response,
    service: TelegramService = Depends(get_telegram_service),
) -> ApprovedChat:
    try:
        validated_channel_id = validate_channel_id(payload.chat_id)
    except InvalidChannelIdError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        summary = await service.get_channel_summary(validated_channel_id)
    except TelegramNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except TelegramRateLimitError as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except TelegramAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except TelegramServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    record = ApprovedChatRecord(
        chat_id=summary.id,
        title=summary.title,
        type=summary.type,
    )
    created = approved_chat_store.upsert(record)
    if not created:
        response.status_code = 200
    return _to_approved_chat(record)


@router.get("/approved-chats", response_model=ApprovedChatsResponse)
async def list_approved_chats() -> ApprovedChatsResponse:
    chats = [_to_approved_chat(record) for record in approved_chat_store.list()]
    return ApprovedChatsResponse(chats=chats)


@router.delete("/approved-chats/{chat_id}", status_code=204)
async def delete_approved_chat(
    chat_id: int,
) -> None:
    try:
        validated_channel_id = validate_channel_id(chat_id)
    except InvalidChannelIdError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    deleted = approved_chat_store.delete(validated_channel_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Approved chat not found.")


@router.get("/approved-chats/{chat_id}/posts", response_model=PostsResponse)
async def get_approved_chat_posts(
    chat_id: int,
    limit: int = Query(10, description="Number of posts to return", ge=1, le=100),
    service: TelegramService = Depends(get_telegram_service),
) -> PostsResponse:
    try:
        validated_channel_id = validate_channel_id(chat_id)
        validated_limit = validate_limit(limit)
    except (InvalidChannelIdError, InvalidLimitError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not approved_chat_store.get(validated_channel_id):
        raise HTTPException(status_code=403, detail="Chat is not approved.")

    try:
        posts = await service.get_channel_posts(validated_channel_id, validated_limit)
    except TelegramNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except TelegramRateLimitError as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except TelegramAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except TelegramServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return PostsResponse(channel_id=validated_channel_id, posts=posts)


@router.get("/channels", response_model=ChannelsResponse)
async def list_channels(
    service: TelegramService = Depends(get_telegram_service),
) -> ChannelsResponse:
    try:
        channels = await service.list_channels()
    except TelegramRateLimitError as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except TelegramAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except TelegramServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return ChannelsResponse(channels=channels)


@router.get("/channels/{channel_id}/posts", response_model=PostsResponse)
async def get_channel_posts(
    channel_id: int,
    limit: int = Query(10, description="Number of posts to return", ge=1, le=100),
    service: TelegramService = Depends(get_telegram_service),
) -> PostsResponse:
    try:
        validated_channel_id = validate_channel_id(channel_id)
        validated_limit = validate_limit(limit)
    except (InvalidChannelIdError, InvalidLimitError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not approved_chat_store.get(validated_channel_id):
        raise HTTPException(status_code=403, detail="Chat is not approved.")

    try:
        posts = await service.get_channel_posts(validated_channel_id, validated_limit)
    except TelegramNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except TelegramRateLimitError as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except TelegramAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except TelegramServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return PostsResponse(channel_id=validated_channel_id, posts=posts)


@router.post("/feeds/{chat_id}/fetch")
async def fetch_feed_posts(
    chat_id: int,
    limit: int = Query(50, description="Number of posts to fetch", ge=1, le=100),
) -> dict:
    """Fetch and persist posts from a Telegram feed to the database."""
    try:
        validated_channel_id = validate_channel_id(chat_id)
        validated_limit = validate_limit(limit)
    except (InvalidChannelIdError, InvalidLimitError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        result = await fetch_telegram_feed(validated_channel_id, validated_limit)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Telegram feed: {str(exc)}")


@router.get("/feeds/fetch-all")
async def fetch_all_feeds(
    limit: int = Query(50, description="Number of posts to fetch per feed", ge=1, le=100),
) -> dict:
    """Fetch and persist posts from all active Telegram feeds."""
    try:
        validated_limit = validate_limit(limit)
    except InvalidLimitError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        result = await fetch_all_active_telegram_feeds(validated_limit)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch all feeds: {str(exc)}")


def _get_db_path() -> Path:
    service_root = Path(__file__).resolve().parents[3]
    return service_root.parent.parent / "api" / "leads.db"


@router.get("/posts")
async def get_stored_posts(
    limit: int = Query(50, description="Number of posts to return", ge=1, le=500),
    chat_id: int = Query(None, description="Filter by chat_id"),
) -> dict:
    """Query stored Telegram posts from the database."""
    try:
        validated_limit = validate_limit(limit)
    except InvalidLimitError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    db_path = _get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if chat_id:
        try:
            validated_chat_id = validate_channel_id(chat_id)
        except InvalidChannelIdError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

        # Get telegram_feed_id
        feed_row = cursor.execute(
            "SELECT id FROM telegram_feeds WHERE chat_id = ?", (validated_chat_id,)
        ).fetchone()

        if not feed_row:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Telegram feed with chat_id {validated_chat_id} not found")

        telegram_feed_id = feed_row["id"]
        rows = cursor.execute(
            """SELECT tp.*, tf.chat_id, tf.title as feed_title
               FROM telegram_posts tp
               JOIN telegram_feeds tf ON tp.telegram_feed_id = tf.id
               WHERE tp.telegram_feed_id = ? AND tp.approval_status = 'approved'
               ORDER BY tp.timestamp DESC
               LIMIT ?""",
            (telegram_feed_id, validated_limit),
        ).fetchall()
    else:
        rows = cursor.execute(
            """SELECT tp.*, tf.chat_id, tf.title as feed_title
               FROM telegram_posts tp
               JOIN telegram_feeds tf ON tp.telegram_feed_id = tf.id
               WHERE tp.approval_status = 'approved'
               ORDER BY tp.timestamp DESC
               LIMIT ?""",
            (validated_limit,),
        ).fetchall()

    posts = [dict(row) for row in rows]
    conn.close()

    return {
        "posts": posts,
        "count": len(posts),
    }
