class InvalidChannelIdError(ValueError):
    pass


class InvalidLimitError(ValueError):
    pass


def validate_channel_id(channel_id: int) -> int:
    if not isinstance(channel_id, int):
        raise InvalidChannelIdError("Channel id must be an integer.")
    if channel_id <= 0:
        raise InvalidChannelIdError("Channel id must be a positive integer.")
    return channel_id


def validate_limit(limit: int) -> int:
    if not isinstance(limit, int):
        raise InvalidLimitError("Limit must be an integer.")
    if limit < 1:
        raise InvalidLimitError("Limit must be at least 1.")
    if limit > 100:
        raise InvalidLimitError("Limit must be at most 100.")
    return limit
