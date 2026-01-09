# Feed Feature

## Overview
Provides a REST endpoint for parsing RSS/Atom feeds using `feedparser`.

## Endpoint
- `GET /feed?url=<feed_url>`

## Response
Returns normalized feed metadata and entries. When parsing encounters issues,
`bozo` is `true` and `bozo_exception` includes the parser error text.

## Notes
- URL validation happens in `utils/validation.py`.
- Feed parsing and normalization live in `features/feed/service/`.
- API routing lives in `features/feed/api/`.
