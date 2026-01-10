# Telegram API Routes

This document describes the FastAPI routes defined in
`apps/telegram/app/main.py` and
`apps/telegram/features/telegram/api/routes.py`. The dev server runs at
`http://127.0.0.1:8001` by default.

## GET /health

Purpose: Simple health check.

Request
- Method: GET
- Path: /health
- Query params: none
- Body: none
- Auth: none

Response
- 200 OK
  - Body:
    ```json
    {
      "status": "ok"
    }
    ```

## POST /telegram/login/request

Purpose: Send a Telegram login code to the configured phone number.

Request
- Method: POST
- Path: /telegram/login/request
- Query params: none
- Body: none
- Auth: none

Responses
- 200 OK
  - Body: `StatusResponse`
    - `status` (string): `code_sent`
    - `detail` (string or null)
  - Example:
    ```json
    {
      "status": "code_sent",
      "detail": null
    }
    ```
- 401 Unauthorized
  - Body:
    ```json
    {
      "detail": "Failed to send login code."
    }
    ```
- 429 Too Many Requests
  - Body:
    ```json
    {
      "detail": "Rate limit exceeded. Retry after <seconds> seconds."
    }
    ```
- 500 Internal Server Error
  - Body:
    ```json
    {
      "detail": "Telegram service unavailable."
    }
    ```
- 502 Bad Gateway
  - Body:
    ```json
    {
      "detail": "<service error message>"
    }
    ```

## POST /telegram/login/confirm

Purpose: Confirm the login code (and optional 2FA password) to authorize the session.

Request
- Method: POST
- Path: /telegram/login/confirm
- Query params: none
- Body:
  ```json
  {
    "code": "12345",
    "password": "optional-2fa"
  }
  ```
- Auth: none

Responses
- 200 OK
  - Body: `StatusResponse`
    - `status` (string): `authorized`
    - `detail` (string or null)
  - Example:
    ```json
    {
      "status": "authorized",
      "detail": null
    }
    ```
- 401 Unauthorized
  - Body:
    ```json
    {
      "detail": "<auth error message>"
    }
    ```
  - Possible messages:
    - `Two-factor password required to finish login.`
    - `Invalid two-factor password.`
    - `Invalid or expired login code.`
    - `Failed to confirm login.`
- 429 Too Many Requests
  - Body:
    ```json
    {
      "detail": "Rate limit exceeded. Retry after <seconds> seconds."
    }
    ```
- 500 Internal Server Error
  - Body:
    ```json
    {
      "detail": "Telegram service unavailable."
    }
    ```
- 502 Bad Gateway
  - Body:
    ```json
    {
      "detail": "<service error message>"
    }
    ```

## GET /telegram/status

Purpose: Check whether the Telegram session is currently authorized.

Request
- Method: GET
- Path: /telegram/status
- Query params: none
- Body: none
- Auth: none

Responses
- 200 OK
  - Body: `AuthStatusResponse`
    - `authorized` (boolean)
    - `status` (string): `authorized` or `unauthorized`
    - `detail` (string or null)
  - Example:
    ```json
    {
      "authorized": true,
      "status": "authorized",
      "detail": null
    }
    ```
- 500 Internal Server Error
  - Body:
    ```json
    {
      "detail": "Telegram service unavailable."
    }
    ```
- 502 Bad Gateway
  - Body:
    ```json
    {
      "detail": "Failed to check authorization status."
    }
    ```

## GET /telegram/media/{file_name}

Purpose: Serve stored image media for chat posts.

Request
- Method: GET
- Path: /telegram/media/{file_name}
- Path params:
  - `file_name` (string, required): Media file name returned in `media.file_name`.
- Query params: none
- Body: none
- Auth: none

Responses
- 200 OK
  - Body: Binary image (`image/jpeg`)
- 404 Not Found
  - Body:
    ```json
    {
      "detail": "Not Found"
    }
    ```

## POST /telegram/approved-chats

Purpose: Add an approved channel/group by id. The id is validated against the
current Telegram dialogs before saving.

Request
- Method: POST
- Path: /telegram/approved-chats
- Query params: none
- Body:
  ```json
  {
    "chat_id": 123456789
  }
  ```
- Auth: none

Responses
- 201 Created
  - Body: `ApprovedChat`
    - `chat_id` (integer)
    - `title` (string)
    - `type` (string): `public` or `private`
  - Example:
    ```json
    {
      "chat_id": 123456789,
      "title": "Example Channel",
      "type": "public"
    }
    ```
- 200 OK
  - Body: `ApprovedChat` (returned when the chat is already approved)
- 400 Bad Request
  - Body:
    ```json
    {
      "detail": "<validation message>"
    }
    ```
  - Possible messages:
    - `Channel id must be an integer.`
    - `Channel id must be a positive integer.`
- 401 Unauthorized
  - Body:
    ```json
    {
      "detail": "Telegram session is not authorized."
    }
    ```
- 404 Not Found
  - Body:
    ```json
    {
      "detail": "Channel not found or not accessible."
    }
    ```
- 429 Too Many Requests
  - Body:
    ```json
    {
      "detail": "Rate limit exceeded. Retry after <seconds> seconds."
    }
    ```
- 500 Internal Server Error
  - Body:
    ```json
    {
      "detail": "Telegram service unavailable."
    }
    ```
- 502 Bad Gateway
  - Body:
    ```json
    {
      "detail": "<service error message>"
    }
    ```

## GET /telegram/approved-chats

Purpose: List the approved channel/group ids stored locally.

Request
- Method: GET
- Path: /telegram/approved-chats
- Query params: none
- Body: none
- Auth: none

Responses
- 200 OK
  - Body: `ApprovedChatsResponse`
    - `chats` (array of objects)
      - `chat_id` (integer)
      - `title` (string)
      - `type` (string): `public` or `private`
  - Example:
    ```json
    {
      "chats": [
        {
          "chat_id": 123456789,
          "title": "Example Channel",
          "type": "public"
        }
      ]
    }
    ```

## DELETE /telegram/approved-chats/{chat_id}

Purpose: Remove an approved channel/group by id.

Request
- Method: DELETE
- Path: /telegram/approved-chats/{chat_id}
- Path params:
  - `chat_id` (integer, required): Telegram channel or group id.
- Query params: none
- Body: none
- Auth: none

Responses
- 204 No Content
- 400 Bad Request
  - Body:
    ```json
    {
      "detail": "<validation message>"
    }
    ```
  - Possible messages:
    - `Channel id must be an integer.`
    - `Channel id must be a positive integer.`
- 404 Not Found
  - Body:
    ```json
    {
      "detail": "Approved chat not found."
    }
    ```

## GET /telegram/approved-chats/{chat_id}/posts

Purpose: Fetch the latest posts from an approved channel or group.

Request
- Method: GET
- Path: /telegram/approved-chats/{chat_id}/posts
- Path params:
  - `chat_id` (integer, required): Telegram channel or group id.
- Query params:
  - `limit` (integer, optional): Number of posts to return (default 10, min 1, max 100).
- Body: none
- Auth: none
- Example:
  - `GET /telegram/approved-chats/123456789/posts?limit=5`

Responses
- 200 OK
  - Body: `PostsResponse`
    - `channel_id` (integer)
    - `posts` (array of objects)
      - `id` (integer)
      - `text` (string or null)
      - `timestamp` (string, ISO 8601)
      - `sender` (object or null)
        - `id` (integer or null)
        - `username` (string or null)
        - `name` (string or null)
        - `type` (string or null): `user`, `bot`, `channel`, or `group`
      - `media` (object or null)
        - `media_type` (string)
        - `mime_type` (string or null)
        - `file_name` (string or null)
        - `size` (integer or null)
        - `url` (string or null)
        - `width` (integer or null)
        - `height` (integer or null)
  - Example:
    ```json
    {
      "channel_id": 123456789,
      "posts": [
        {
          "id": 999,
          "text": "Hello from Telegram",
          "timestamp": "2024-01-01T12:00:00Z",
          "sender": {
            "id": 111,
            "username": "example_user",
            "name": "Example User",
            "type": "user"
          },
          "media": {
            "media_type": "MessageMediaPhoto",
            "mime_type": "image/jpeg",
            "file_name": "chat_123456789_msg_999.jpg",
            "size": 245321,
            "url": "/telegram/media/chat_123456789_msg_999.jpg",
            "width": 1080,
            "height": 1080
          }
        }
      ]
    }
    ```
Notes
- Only image media is returned. Videos and non-image files are skipped.
- Images are stored locally and resized/compressed to stay under 1 MB, then served from `/telegram/media/{file_name}`.
- 400 Bad Request
  - Body:
    ```json
    {
      "detail": "<validation message>"
    }
    ```
  - Possible messages:
    - `Channel id must be an integer.`
    - `Channel id must be a positive integer.`
    - `Limit must be an integer.`
    - `Limit must be at least 1.`
    - `Limit must be at most 100.`
- 401 Unauthorized
  - Body:
    ```json
    {
      "detail": "Telegram session is not authorized."
    }
    ```
- 403 Forbidden
  - Body:
    ```json
    {
      "detail": "Chat is not approved."
    }
    ```
- 404 Not Found
  - Body:
    ```json
    {
      "detail": "Channel not found or not accessible."
    }
    ```
- 429 Too Many Requests
  - Body:
    ```json
    {
      "detail": "Rate limit exceeded. Retry after <seconds> seconds."
    }
    ```
- 500 Internal Server Error
  - Body:
    ```json
    {
      "detail": "Telegram service unavailable."
    }
    ```
- 502 Bad Gateway
  - Body:
    ```json
    {
      "detail": "Failed to fetch messages."
    }
    ```

## GET /telegram/channels

Purpose: List the Telegram channels and groups accessible to the account.

Request
- Method: GET
- Path: /telegram/channels
- Query params: none
- Body: none
- Auth: none

Responses
- 200 OK
  - Body: `ChannelsResponse`
    - `channels` (array of objects)
      - `id` (integer): channel or group id
      - `title` (string)
      - `username` (string or null)
      - `type` (string): `public` or `private`
  - Example:
    ```json
    {
      "channels": [
        {
          "id": 123456789,
          "title": "Example Channel",
          "username": "example",
          "type": "public"
        }
      ]
    }
    ```
- 401 Unauthorized
  - Body:
    ```json
    {
      "detail": "Telegram session is not authorized."
    }
    ```
- 429 Too Many Requests
  - Body:
    ```json
    {
      "detail": "Rate limit exceeded. Retry after <seconds> seconds."
    }
    ```
- 500 Internal Server Error
  - Body:
    ```json
    {
      "detail": "Telegram service unavailable."
    }
    ```
- 502 Bad Gateway
  - Body:
    ```json
    {
      "detail": "Failed to fetch dialogs."
    }
    ```

## GET /telegram/channels/{channel_id}/posts

Purpose: Fetch the latest posts from an approved channel or group.

Request
- Method: GET
- Path: /telegram/channels/{channel_id}/posts
- Path params:
  - `channel_id` (integer, required): Telegram channel or group id.
- Query params:
  - `limit` (integer, optional): Number of posts to return (default 10, min 1, max 100).
- Body: none
- Auth: none
- Example:
  - `GET /telegram/channels/123456789/posts?limit=5`

Responses
- 200 OK
  - Body: `PostsResponse`
    - `channel_id` (integer)
    - `posts` (array of objects)
      - `id` (integer)
      - `text` (string or null)
      - `timestamp` (string, ISO 8601)
      - `sender` (object or null)
        - `id` (integer or null)
        - `username` (string or null)
        - `name` (string or null)
        - `type` (string or null): `user`, `bot`, `channel`, or `group`
      - `media` (object or null)
        - `media_type` (string)
        - `mime_type` (string or null)
        - `file_name` (string or null)
        - `size` (integer or null)
        - `url` (string or null)
        - `width` (integer or null)
        - `height` (integer or null)
  - Example:
    ```json
    {
      "channel_id": 123456789,
      "posts": [
        {
          "id": 999,
          "text": "Hello from Telegram",
          "timestamp": "2024-01-01T12:00:00Z",
          "sender": {
            "id": 111,
            "username": "example_user",
            "name": "Example User",
            "type": "user"
          },
          "media": {
            "media_type": "MessageMediaPhoto",
            "mime_type": "image/jpeg",
            "file_name": "chat_123456789_msg_999.jpg",
            "size": 245321,
            "url": "/telegram/media/chat_123456789_msg_999.jpg",
            "width": 1080,
            "height": 1080
          }
        }
      ]
    }
    ```
Notes
- Only image media is returned. Videos and non-image files are skipped.
- Images are stored locally and resized/compressed to stay under 1 MB, then served from `/telegram/media/{file_name}`.
- 400 Bad Request
  - Body:
    ```json
    {
      "detail": "<validation message>"
    }
    ```
  - Possible messages:
    - `Channel id must be an integer.`
    - `Channel id must be a positive integer.`
    - `Limit must be an integer.`
    - `Limit must be at least 1.`
    - `Limit must be at most 100.`
- 401 Unauthorized
  - Body:
    ```json
    {
      "detail": "Telegram session is not authorized."
    }
    ```
- 403 Forbidden
  - Body:
    ```json
    {
      "detail": "Chat is not approved."
    }
    ```
- 404 Not Found
  - Body:
    ```json
    {
      "detail": "Channel not found or not accessible."
    }
    ```
- 429 Too Many Requests
  - Body:
    ```json
    {
      "detail": "Rate limit exceeded. Retry after <seconds> seconds."
    }
    ```
- 500 Internal Server Error
  - Body:
    ```json
    {
      "detail": "Telegram service unavailable."
    }
    ```
- 502 Bad Gateway
  - Body:
    ```json
    {
      "detail": "Failed to fetch messages."
    }
    ```
