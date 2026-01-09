from urllib.parse import urlparse


class InvalidUrlError(ValueError):
    pass


def validate_feed_url(url: str) -> str:
    if not isinstance(url, str):
        raise InvalidUrlError("URL must be a string.")

    cleaned = url.strip()
    if not cleaned:
        raise InvalidUrlError("URL is required.")

    parsed = urlparse(cleaned)
    if parsed.scheme not in ("http", "https"):
        raise InvalidUrlError("URL must start with http or https.")
    if not parsed.netloc:
        raise InvalidUrlError("URL must include a hostname.")

    return cleaned
