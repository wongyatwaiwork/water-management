from datetime import timedelta

from django.conf import settings
from django.db.models import Avg, DateTimeField, Func, Max, Min
from django.db.models.functions import ExtractHour, ExtractWeekDay, TruncDay
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.exceptions import ValidationError

from readings.models import SensorReading

BUCKETS = {"5m": ("5 minutes", 300), "1h": ("1 hour", 3600), "1d": ("1 day", 86400)}


class TimeBucket(Func):
    output_field = DateTimeField()

    def __init__(self, expression, bucket: str):
        self.bucket = bucket
        super().__init__(expression)

    def as_postgresql(self, compiler, connection, **extra_context):
        expression_sql, params = compiler.compile(self.source_expressions[0])
        interval = BUCKETS[self.bucket][0]
        return (
            f"date_bin(INTERVAL '{interval}', {expression_sql}, TIMESTAMPTZ '1970-01-01')",
            params,
        )

    def as_sqlite(self, compiler, connection, **extra_context):
        expression_sql, params = compiler.compile(self.source_expressions[0])
        seconds = BUCKETS[self.bucket][1]
        return (
            f"datetime((strftime('%%s', {expression_sql}) / {seconds}) * {seconds}, 'unixepoch')",
            params,
        )


def parse_range(params, *, default_days: int = 1):
    end = parse_datetime(params.get("to", "")) if params.get("to") else timezone.now()
    start = (
        parse_datetime(params.get("from", ""))
        if params.get("from")
        else end - timedelta(days=default_days)
    )
    if not start or not end:
        raise ValidationError({"code": "invalid_time_range", "details": "Use ISO-8601 timestamps."})
    if timezone.is_naive(start):
        start = timezone.make_aware(start)
    if timezone.is_naive(end):
        end = timezone.make_aware(end)
    if start >= end:
        raise ValidationError({"code": "invalid_time_range", "details": "from must be before to."})
    if end - start > timedelta(days=settings.ANALYTICS_MAX_RANGE_DAYS):
        raise ValidationError(
            {
                "code": "range_too_large",
                "details": f"Maximum range is {settings.ANALYTICS_MAX_RANGE_DAYS} days.",
            }
        )
    return start, end


def filtered_readings(params, *, default_days: int = 1):
    start, end = parse_range(params, default_days=default_days)
    queryset = SensorReading.objects.filter(timestamp__gte=start, timestamp__lte=end)
    device_id = params.get("device_id")
    site_id = params.get("site_id")
    if device_id:
        queryset = queryset.filter(device__serial_number=device_id)
    if site_id:
        queryset = queryset.filter(device__site_id=site_id)
    return queryset, start, end


def usage_series(params):
    bucket = params.get("bucket", "5m")
    if bucket not in BUCKETS:
        raise ValidationError(
            {"code": "invalid_bucket", "details": "bucket must be 5m, 1h, or 1d."}
        )
    queryset, start, end = filtered_readings(params)
    rows = (
        queryset.annotate(bucket_time=TimeBucket("timestamp", bucket))
        .values("bucket_time")
        .annotate(
            minimum_volume=Min("cumulative_volume_l"),
            maximum_volume=Max("cumulative_volume_l"),
            average_flow=Avg("flow_rate_lpm"),
            maximum_flow=Max("flow_rate_lpm"),
        )
        .order_by("bucket_time")
    )
    points = [
        {
            "timestamp": row["bucket_time"],
            "volume_liters": float(row["maximum_volume"] - row["minimum_volume"]),
            "average_flow_rate_lpm": float(row["average_flow"]),
            "max_flow_rate_lpm": float(row["maximum_flow"]),
        }
        for row in rows
    ]
    return {
        "device_id": params.get("device_id"),
        "site_id": params.get("site_id"),
        "from": start,
        "to": end,
        "bucket": bucket,
        "points": points,
    }


def daily_consumption(params):
    queryset, start, end = filtered_readings(params, default_days=7)
    rows = (
        queryset.annotate(day=TruncDay("timestamp"))
        .values("day", "device_id")
        .annotate(minimum=Min("cumulative_volume_l"), maximum=Max("cumulative_volume_l"))
        .order_by("day")
    )
    totals = {}
    for row in rows:
        key = row["day"]
        totals[key] = totals.get(key, 0.0) + float(row["maximum"] - row["minimum"])
    return {
        "from": start,
        "to": end,
        "points": [
            {"date": day, "volume_liters": round(volume, 3)} for day, volume in totals.items()
        ],
    }


def usage_heatmap(params):
    queryset, start, end = filtered_readings(params, default_days=30)
    rows = (
        queryset.annotate(day_of_week=ExtractWeekDay("timestamp"), hour=ExtractHour("timestamp"))
        .values("day_of_week", "hour")
        .annotate(average_flow=Avg("flow_rate_lpm"))
        .order_by("day_of_week", "hour")
    )
    points = [
        {
            "day_of_week": (row["day_of_week"] + 5) % 7,
            "hour": row["hour"],
            "average_flow_rate_lpm": round(float(row["average_flow"]), 3),
        }
        for row in rows
    ]
    return {"from": start, "to": end, "points": points}
