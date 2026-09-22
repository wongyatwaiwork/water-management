from datetime import timedelta

from django.conf import settings
from django.db.models import Max, Min, OuterRef, Subquery, Sum
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from anomalies.models import Anomaly
from fleet.models import Device
from readings.models import SensorReading

from .serializers import (
    DailyResponseSerializer,
    HeatmapResponseSerializer,
    SummaryResponseSerializer,
    UsageResponseSerializer,
)
from .services import daily_consumption, usage_heatmap, usage_series

ANALYTICS_PARAMETERS = [
    OpenApiParameter("device_id", str, description="Device serial number"),
    OpenApiParameter("site_id", int),
    OpenApiParameter("from", str, description="ISO-8601 start time"),
    OpenApiParameter("to", str, description="ISO-8601 end time"),
]


class UsageView(APIView):
    @extend_schema(
        parameters=[
            *ANALYTICS_PARAMETERS,
            OpenApiParameter("bucket", str, enum=["5m", "1h", "1d"]),
        ],
        responses=UsageResponseSerializer,
    )
    def get(self, request):
        return Response(usage_series(request.query_params))


class DailyConsumptionView(APIView):
    @extend_schema(parameters=ANALYTICS_PARAMETERS, responses=DailyResponseSerializer)
    def get(self, request):
        return Response(daily_consumption(request.query_params))


class HeatmapView(APIView):
    @extend_schema(parameters=ANALYTICS_PARAMETERS, responses=HeatmapResponseSerializer)
    def get(self, request):
        return Response(usage_heatmap(request.query_params))


class SummaryView(APIView):
    @extend_schema(responses=SummaryResponseSerializer)
    def get(self, request):
        now = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        stale_before = now - timedelta(minutes=settings.DEVICE_STALE_MINUTES)
        devices = Device.objects.exclude(status=Device.Status.DECOMMISSIONED)
        latest_flow = (
            SensorReading.objects.filter(device=OuterRef("pk"))
            .order_by("-timestamp")
            .values("flow_rate_lpm")[:1]
        )
        current_flow = (
            devices.annotate(latest_flow=Subquery(latest_flow)).aggregate(total=Sum("latest_flow"))[
                "total"
            ]
            or 0
        )
        per_device = (
            SensorReading.objects.filter(timestamp__gte=today)
            .values("device_id")
            .annotate(minimum=Min("cumulative_volume_l"), maximum=Max("cumulative_volume_l"))
        )
        today_usage = sum(float(row["maximum"] - row["minimum"]) for row in per_device)
        return Response(
            {
                "today_usage_liters": round(today_usage, 2),
                "current_total_flow_lpm": round(float(current_flow), 2),
                "active_devices": devices.filter(
                    status=Device.Status.ACTIVE, last_seen_at__gte=stale_before
                ).count(),
                "offline_or_stale_devices": devices.filter(status=Device.Status.OFFLINE).count()
                + devices.filter(
                    status=Device.Status.ACTIVE, last_seen_at__lt=stale_before
                ).count(),
                "open_anomalies": Anomaly.objects.filter(status=Anomaly.Status.OPEN).count(),
                "generated_at": now,
            }
        )
