from django.db.models import Count, OuterRef, Subquery
from rest_framework import mixins, viewsets

from readings.models import SensorReading

from .models import Device, Site
from .serializers import DeviceSerializer, SiteSerializer


class SiteViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SiteSerializer
    queryset = Site.objects.annotate(device_count=Count("devices")).order_by("name")


class DeviceViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = DeviceSerializer

    def get_queryset(self):
        latest = SensorReading.objects.filter(device=OuterRef("pk")).order_by("-timestamp")
        queryset = Device.objects.select_related("site").annotate(
            latest_flow_rate_lpm=Subquery(latest.values("flow_rate_lpm")[:1]),
            latest_battery_voltage=Subquery(latest.values("battery_voltage")[:1]),
            latest_reading_at=Subquery(latest.values("timestamp")[:1]),
        )
        for field in ("status", "device_type"):
            value = self.request.query_params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        site = self.request.query_params.get("site")
        if site:
            queryset = queryset.filter(site_id=site)
        return queryset.order_by("site__name", "name")
