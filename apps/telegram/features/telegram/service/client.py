from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

from PIL import Image

from telethon import TelegramClient
from telethon.errors import (
    FloodWaitError,
    PhoneCodeExpiredError,
    PhoneCodeInvalidError,
    RPCError,
    SessionPasswordNeededError,
)

from features.telegram.schema.models import (
    ChannelSummary,
    MediaMetadata,
    Post,
    SenderInfo,
)


class TelegramConfigError(RuntimeError):
    pass


class TelegramAuthError(RuntimeError):
    pass


class TelegramRateLimitError(RuntimeError):
    def __init__(self, seconds: int) -> None:
        super().__init__(f"Rate limit exceeded. Retry after {seconds} seconds.")
        self.seconds = seconds


class TelegramNotFoundError(RuntimeError):
    pass


class TelegramServiceError(RuntimeError):
    pass


@dataclass(frozen=True)
class TelegramSettings:
    api_id: int
    api_hash: str
    phone: str
    session_name: str
    sessions_dir: Path

    @property
    def session_path(self) -> Path:
        return self.sessions_dir / self.session_name


def _service_root() -> Path:
    return Path(__file__).resolve().parents[3]


MAX_IMAGE_BYTES = 1_000_000


def _media_root() -> Path:
    return _service_root() / "data" / "media"


def _media_path(chat_id: int, message_id: int) -> Path:
    return _media_root() / f"chat_{chat_id}_msg_{message_id}.jpg"


def _is_video_message(message) -> bool:
    if getattr(message, "video", None):
        return True
    file = getattr(message, "file", None)
    mime_type = getattr(file, "mime_type", None) if file else None
    return bool(mime_type and mime_type.startswith("video/"))


def _is_image_message(message) -> bool:
    if getattr(message, "photo", None):
        return True
    file = getattr(message, "file", None)
    mime_type = getattr(file, "mime_type", None) if file else None
    return bool(mime_type and mime_type.startswith("image/"))


def _clean_env_value(value: str) -> str:
    cleaned = value.strip()
    if cleaned.startswith(("\"", "'")) and cleaned.endswith(("\"", "'")):
        cleaned = cleaned[1:-1]
    return cleaned


def load_settings() -> TelegramSettings:
    api_id_raw = os.getenv("TELEGRAM_API_ID")
    if not api_id_raw:
        raise TelegramConfigError("TELEGRAM_API_ID is required.")
    try:
        api_id = int(_clean_env_value(api_id_raw))
    except ValueError as exc:
        raise TelegramConfigError("TELEGRAM_API_ID must be an integer.") from exc

    api_hash = os.getenv("TELEGRAM_API_HASH")
    if not api_hash:
        raise TelegramConfigError("TELEGRAM_API_HASH is required.")
    api_hash = _clean_env_value(api_hash)

    phone = os.getenv("TELEGRAM_PHONE")
    if not phone:
        raise TelegramConfigError("TELEGRAM_PHONE is required.")

    session_name_raw = os.getenv("TELEGRAM_SESSION_NAME", "telegram_user.session")
    session_name = _clean_env_value(session_name_raw) or "telegram_user.session"

    sessions_dir = _service_root() / "sessions"

    return TelegramSettings(
        api_id=api_id,
        api_hash=api_hash,
        phone=_clean_env_value(phone),
        session_name=session_name,
        sessions_dir=sessions_dir,
    )


class TelegramService:
    def __init__(self, settings: TelegramSettings) -> None:
        self.settings = settings
        self.settings.session_path.parent.mkdir(parents=True, exist_ok=True)
        self.client = TelegramClient(
            str(self.settings.session_path),
            self.settings.api_id,
            self.settings.api_hash,
        )
        self._login_lock = asyncio.Lock()

    @classmethod
    def from_env(cls) -> "TelegramService":
        return cls(load_settings())

    async def connect(self) -> None:
        self.settings.session_path.parent.mkdir(parents=True, exist_ok=True)
        await self.client.connect()

    async def disconnect(self) -> None:
        if self.client.is_connected():
            await self.client.disconnect()

    async def request_login_code(self) -> None:
        try:
            await self.client.send_code_request(self.settings.phone)
        except FloodWaitError as exc:
            raise TelegramRateLimitError(exc.seconds) from exc
        except RPCError as exc:
            raise TelegramAuthError("Failed to send login code.") from exc

    async def confirm_login(self, code: str, password: Optional[str] = None) -> None:
        async with self._login_lock:
            if await self.client.is_user_authorized():
                return
            try:
                await self.client.sign_in(self.settings.phone, code)
            except SessionPasswordNeededError as exc:
                if not password:
                    raise TelegramAuthError(
                        "Two-factor password required to finish login."
                    ) from exc
                try:
                    await self.client.sign_in(password=password)
                except RPCError as password_exc:
                    raise TelegramAuthError("Invalid two-factor password.") from password_exc
            except (PhoneCodeInvalidError, PhoneCodeExpiredError) as exc:
                raise TelegramAuthError("Invalid or expired login code.") from exc
            except FloodWaitError as exc:
                raise TelegramRateLimitError(exc.seconds) from exc
            except RPCError as exc:
                raise TelegramAuthError("Failed to confirm login.") from exc

    async def is_authorized(self) -> bool:
        try:
            return await self.client.is_user_authorized()
        except RPCError as exc:
            raise TelegramServiceError(
                "Failed to check authorization status."
            ) from exc

    async def list_channels(self) -> List[ChannelSummary]:
        await self._ensure_authorized()
        try:
            dialogs = await self.client.get_dialogs(limit=None)
        except FloodWaitError as exc:
            raise TelegramRateLimitError(exc.seconds) from exc
        except RPCError as exc:
            raise TelegramServiceError("Failed to fetch dialogs.") from exc

        channels: List[ChannelSummary] = []
        for dialog in dialogs:
            if not (dialog.is_channel or dialog.is_group):
                continue
            entity = dialog.entity
            title = getattr(entity, "title", None)
            if not title:
                continue
            username = getattr(entity, "username", None)
            channel_type = "public" if username else "private"
            channels.append(
                ChannelSummary(
                    id=entity.id,
                    title=title,
                    username=username,
                    type=channel_type,
                )
            )

        return channels

    async def get_channel_summary(self, channel_id: int) -> ChannelSummary:
        await self._ensure_authorized()
        entity = await self._get_accessible_entity(channel_id)
        title = getattr(entity, "title", None)
        if not title:
            raise TelegramServiceError("Channel title unavailable.")
        username = getattr(entity, "username", None)
        channel_type = "public" if username else "private"
        return ChannelSummary(
            id=entity.id,
            title=title,
            username=username,
            type=channel_type,
        )

    async def get_channel_posts(self, channel_id: int, limit: int) -> List[Post]:
        await self._ensure_authorized()
        entity = await self._get_accessible_entity(channel_id)

        posts: List[Post] = []
        try:
            async for message in self.client.iter_messages(entity, limit=limit):
                posts.append(
                    Post(
                        id=message.id,
                        text=message.message,
                        timestamp=message.date,
                        media=await _build_media_metadata(message, channel_id),
                        sender=await _build_sender_info(message, entity),
                    )
                )
        except FloodWaitError as exc:
            raise TelegramRateLimitError(exc.seconds) from exc
        except RPCError as exc:
            raise TelegramServiceError("Failed to fetch messages.") from exc

        return posts

    async def _get_accessible_entity(self, channel_id: int):
        try:
            dialogs = await self.client.get_dialogs(limit=None)
        except FloodWaitError as exc:
            raise TelegramRateLimitError(exc.seconds) from exc
        except RPCError as exc:
            raise TelegramServiceError("Failed to fetch dialogs.") from exc

        for dialog in dialogs:
            if not (dialog.is_channel or dialog.is_group):
                continue
            entity = dialog.entity
            if getattr(entity, "id", None) == channel_id:
                return entity

        raise TelegramNotFoundError("Channel not found or not accessible.")

    async def _ensure_authorized(self) -> None:
        if not await self.client.is_user_authorized():
            raise TelegramAuthError("Telegram session is not authorized.")


def _sender_display_name(sender) -> Optional[str]:
    title = getattr(sender, "title", None)
    if title:
        return title
    first = getattr(sender, "first_name", None)
    last = getattr(sender, "last_name", None)
    if first and last:
        return f"{first} {last}"
    return first or last


def _sender_type(sender) -> Optional[str]:
    type_name = type(sender).__name__.lower()
    if type_name == "user":
        return "bot" if getattr(sender, "bot", False) else "user"
    if type_name == "channel":
        return "group" if getattr(sender, "megagroup", False) else "channel"
    return None


async def _build_sender_info(message, channel_entity) -> Optional[SenderInfo]:
    post_author = getattr(message, "post_author", None)
    if getattr(message, "post", False):
        name = post_author or getattr(channel_entity, "title", None)
        return SenderInfo(
            id=getattr(channel_entity, "id", None),
            username=getattr(channel_entity, "username", None),
            name=name,
            type="channel",
        )

    sender_id = getattr(message, "sender_id", None)
    sender = getattr(message, "sender", None)
    if sender is None:
        try:
            sender = await message.get_sender()
        except (FloodWaitError, RPCError):
            if sender_id or post_author:
                return SenderInfo(id=sender_id, name=post_author)
            return None

    if sender is None:
        if sender_id or post_author:
            return SenderInfo(id=sender_id, name=post_author)
        return None

    name = _sender_display_name(sender) or post_author
    return SenderInfo(
        id=getattr(sender, "id", sender_id),
        username=getattr(sender, "username", None),
        name=name,
        type=_sender_type(sender),
    )


def _load_image_info(path: Path) -> Optional[tuple[int, int, int]]:
    try:
        with Image.open(path) as image:
            width, height = image.size
        size = path.stat().st_size
        return width, height, size
    except OSError:
        return None


def _save_image_with_limit(source_path: Path, target_path: Path) -> Optional[tuple[int, int, int]]:
    try:
        with Image.open(source_path) as image:
            if image.mode != "RGB":
                image = image.convert("RGB")
            width, height = image.size
            quality = 85
            for _ in range(6):
                image.save(
                    target_path,
                    format="JPEG",
                    optimize=True,
                    quality=quality,
                )
                size = target_path.stat().st_size
                if size <= MAX_IMAGE_BYTES:
                    return width, height, size
                quality -= 10
                if quality < 45:
                    width = int(width * 0.85)
                    height = int(height * 0.85)
                    if width < 200 or height < 200:
                        break
                    image = image.resize((width, height), Image.LANCZOS)
                    quality = 85
    except OSError:
        pass

    if target_path.exists():
        target_path.unlink()
    return None


async def _build_media_metadata(message, chat_id: int) -> Optional[MediaMetadata]:
    if not getattr(message, "media", None):
        return None
    if _is_video_message(message):
        return None
    if not _is_image_message(message):
        return None

    target_path = _media_path(chat_id, message.id)
    target_path.parent.mkdir(parents=True, exist_ok=True)

    if not target_path.exists():
        temp_path = target_path.with_suffix(".tmp")
        try:
            await message.download_media(file=temp_path)
        except (FloodWaitError, RPCError):
            if temp_path.exists():
                temp_path.unlink()
            return None

        info = _save_image_with_limit(temp_path, target_path)
        if temp_path.exists():
            temp_path.unlink()
        if info is None:
            return None
        width, height, size = info
    else:
        info = _load_image_info(target_path)
        if info is None:
            target_path.unlink()
            return None
        width, height, size = info
        if size > MAX_IMAGE_BYTES:
            info = _save_image_with_limit(target_path, target_path)
            if info is None:
                return None
            width, height, size = info

    return MediaMetadata(
        media_type=type(message.media).__name__,
        mime_type="image/jpeg",
        file_name=target_path.name,
        size=size,
        url=f"/telegram/media/{target_path.name}",
        width=width,
        height=height,
    )
