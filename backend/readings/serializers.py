from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from fleet.models import Device

from .models import SensorReading


class SensorReadingSerializer(serializers.ModelSerializer):
    device_id = serializers.SlugRelatedField(
        source="device", slug_field="serial_number", queryset=Device.objects.all()
    )
    flow_rate_lpm = serializers.DecimalField(
        max_digits=10, decimal_places=3, min_value=Decimal("0")
    )
    cumulative_volume_l = serializers.DecimalField(
        max_digits=16, decimal_places=3, min_value=Decimal("0")
    )
    battery_voltage = serializers.DecimalField(
        max_digits=5,
        decimal_places=3,
        min_value=Decimal("0"),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = SensorReading
        fields = [
            "id",
            "device_id",
            "timestamp",
            "flow_rate_lpm",
            "cumulative_volume_l",
            "battery_voltage",
            "signal_strength",
            "received_at",
        ]
        read_only_fields = ["id", "received_at"]

    def validate_timestamp(self, value):
        future_limit = timezone.now() + timedelta(minutes=settings.READING_FUTURE_TOLERANCE_MINUTES)
        if value > future_limit:
            raise serializers.ValidationError(
                "Timestamp is too far in the future.", code="future_timestamp"
            )
        return value

    def validate(self, attrs):
        device = attrs.get("device")
        timestamp = attrs.get("timestamp")
        cumulative = attrs.get("cumulative_volume_l")
        if device and timestamp:
            if SensorReading.objects.filter(device=device, timestamp=timestamp).exists():
                raise serializers.ValidationError(
                    {"timestamp": "A reading already exists for this device and timestamp."},
                    code="duplicate_reading",
                )
            previous = (
                SensorReading.objects.filter(device=device, timestamp__lt=timestamp)
                .order_by("-timestamp")
                .only("cumulative_volume_l")
                .first()
            )
            if previous and cumulative is not None and cumulative < previous.cumulative_volume_l:
                raise serializers.ValidationError(
                    {
                        "cumulative_volume_l": "Cumulative volume is lower than the preceding reading."
                    },
                    code="decreasing_cumulative_volume",
                )
        return attrs


class ReadingQuerySerializer(serializers.Serializer):
    device_id = serializers.CharField(required=False)
    site_id = serializers.IntegerField(required=False, min_value=1)
    start = serializers.DateTimeField(required=False, source="from")
    end = serializers.DateTimeField(required=False, source="to")


class BulkReadingRequestSerializer(serializers.Serializer):
    readings = SensorReadingSerializer(many=True)


class BulkResultSerializer(serializers.Serializer):
    index = serializers.IntegerField()
    status = serializers.ChoiceField(choices=["accepted", "rejected"])
    id = serializers.IntegerField(required=False)
    code = serializers.CharField(required=False)
    details = serializers.DictField(required=False)


class BulkReadingResponseSerializer(serializers.Serializer):
    accepted = serializers.IntegerField()
    rejected = serializers.IntegerField()
    results = BulkResultSerializer(many=True)
