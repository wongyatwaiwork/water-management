from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Device, Site


class SiteSerializer(serializers.ModelSerializer):
    device_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Site
        fields = [
            "id",
            "name",
            "code",
            "location",
            "timezone",
            "device_count",
            "created_at",
            "updated_at",
        ]


class DeviceSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(source="site.name", read_only=True)
    site_code = serializers.CharField(source="site.code", read_only=True)
    latest_flow_rate_lpm = serializers.DecimalField(max_digits=10, decimal_places=3, read_only=True)
    latest_battery_voltage = serializers.DecimalField(
        max_digits=5, decimal_places=3, read_only=True
    )
    latest_reading_at = serializers.DateTimeField(read_only=True)
    is_stale = serializers.SerializerMethodField()

    @extend_schema_field(serializers.BooleanField)
    def get_is_stale(self, device: Device) -> bool:
        if device.status != Device.Status.ACTIVE:
            return False
        stale_before = timezone.now() - timedelta(minutes=settings.DEVICE_STALE_MINUTES)
        return device.last_seen_at is None or device.last_seen_at < stale_before

    class Meta:
        model = Device
        fields = [
            "id",
            "site",
            "site_name",
            "site_code",
            "serial_number",
            "name",
            "device_type",
            "status",
            "installed_at",
            "last_seen_at",
            "latest_flow_rate_lpm",
            "latest_battery_voltage",
            "latest_reading_at",
            "is_stale",
            "created_at",
            "updated_at",
        ]
