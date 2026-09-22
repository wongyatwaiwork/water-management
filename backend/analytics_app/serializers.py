from rest_framework import serializers


class UsagePointSerializer(serializers.Serializer):
    timestamp = serializers.DateTimeField()
    volume_liters = serializers.FloatField()
    average_flow_rate_lpm = serializers.FloatField()
    max_flow_rate_lpm = serializers.FloatField()


class UsageResponseSerializer(serializers.Serializer):
    device_id = serializers.CharField(allow_null=True)
    site_id = serializers.CharField(allow_null=True)
    from_time = serializers.DateTimeField(source="from")
    to_time = serializers.DateTimeField(source="to")
    bucket = serializers.ChoiceField(choices=["5m", "1h", "1d"])
    points = UsagePointSerializer(many=True)


class DailyPointSerializer(serializers.Serializer):
    date = serializers.DateTimeField()
    volume_liters = serializers.FloatField()


class DailyResponseSerializer(serializers.Serializer):
    from_time = serializers.DateTimeField(source="from")
    to_time = serializers.DateTimeField(source="to")
    points = DailyPointSerializer(many=True)


class HeatmapPointSerializer(serializers.Serializer):
    day_of_week = serializers.IntegerField()
    hour = serializers.IntegerField()
    average_flow_rate_lpm = serializers.FloatField()


class HeatmapResponseSerializer(serializers.Serializer):
    from_time = serializers.DateTimeField(source="from")
    to_time = serializers.DateTimeField(source="to")
    points = HeatmapPointSerializer(many=True)


class SummaryResponseSerializer(serializers.Serializer):
    today_usage_liters = serializers.FloatField()
    current_total_flow_lpm = serializers.FloatField()
    active_devices = serializers.IntegerField()
    offline_or_stale_devices = serializers.IntegerField()
    open_anomalies = serializers.IntegerField()
    generated_at = serializers.DateTimeField()
