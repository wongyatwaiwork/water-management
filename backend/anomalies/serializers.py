from rest_framework import serializers

from .models import Anomaly


class AnomalySerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source="device.name", read_only=True)
    device_serial_number = serializers.CharField(source="device.serial_number", read_only=True)
    site_id = serializers.IntegerField(source="device.site_id", read_only=True)
    site_name = serializers.CharField(source="device.site.name", read_only=True)

    class Meta:
        model = Anomaly
        fields = [
            "id",
            "device",
            "device_name",
            "device_serial_number",
            "site_id",
            "site_name",
            "start_time",
            "end_time",
            "anomaly_type",
            "severity",
            "description",
            "detected_at",
            "status",
        ]
        read_only_fields = [
            "device",
            "start_time",
            "end_time",
            "anomaly_type",
            "severity",
            "description",
            "detected_at",
        ]
