def mask_username(username):
    length = len(username)
    if length >= 7:
        return username[:3] + '*' * (length - 4) + username[-1]
    elif length >= 2:
        return username[0] + '*' * (length - 2) + username[-1]
    else:
        return username