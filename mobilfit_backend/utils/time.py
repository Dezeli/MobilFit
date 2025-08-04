from django.utils.timezone import now

def get_month_range():
    today = now()
    start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end = today
    return start, end
