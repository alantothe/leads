# API Routes

This document describes the FastAPI routes defined in
`apps/api/app/main.py` and
`apps/api/features/feed/api/routes.py`. The dev server runs at
`http://127.0.0.1:8428` by default.

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

## GET /feed

Purpose: Parse an RSS/Atom feed URL and return normalized metadata and
entries.

Request
- Method: GET
- Path: /feed
- Query params:
  - `url` (string, required): Feed URL to parse. Must be a non-empty
    string, start with `http` or `https`, and include a hostname.
- Body: none
- Auth: none
- Example:
  - `GET /feed?url=https://example.com/rss.xml`

Responses
- 200 OK
  - Body: `FeedResponse`
    - `feed` (object)
      - `title`, `link`, `subtitle`, `language`, `updated`, `published`,
        `author` (string or null)
    - `entries` (array of objects)
      - `id`, `title`, `link`, `summary`, `content`, `published`,
        `updated`, `author` (string or null)
    - `bozo` (boolean): true if the feed parser reported a parsing issue.
    - `bozo_exception` (string or null): stringified parser exception
      when `bozo` is true.
  - Example:
    ```json
    {
      "feed": {
        "title": "Example Feed",
        "link": "https://example.com",
        "subtitle": "News",
        "language": "en",
        "updated": "2024-01-01T00:00:00Z",
        "published": null,
        "author": "Example Author"
      },
      "entries": [
        {
          "id": "https://example.com/post/1",
          "title": "Post 1",
          "link": "https://example.com/post/1",
          "summary": "Short summary",
          "content": "<p>Full content</p>",
          "published": "2024-01-01T00:00:00Z",
          "updated": null,
          "author": "Jane Doe"
        }
      ],
      "bozo": false,
      "bozo_exception": null
    }
    ```

- 400 Bad Request
  - Body:
    ```json
    {
      "detail": "<message>"
    }
    ```
  - Possible messages:
    - `URL must be a string.`
    - `URL is required.`
    - `URL must start with http or https.`
    - `URL must include a hostname.`
