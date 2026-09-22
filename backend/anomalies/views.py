from rest_framework import mixins, viewsets

from .models import Anomaly
from .serializers import AnomalySerializer


class AnomalyViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = AnomalySerializer

    def get_queryset(self):
        queryset = Anomaly.objects.select_related("device", "device__site")
        filters = {
            "device_id": "device_id",
            "site": "device__site_id",
            "severity": "severity",
            "type": "anomaly_type",
            "status": "status",
        }
        for parameter, field in filters.items():
            value = self.request.query_params.get(parameter)
            if value:
                queryset = queryset.filter(**{field: value})
        device_serial = self.request.query_params.get("device")
        if device_serial:
            queryset = queryset.filter(device__serial_number=device_serial)
        from_time = self.request.query_params.get("from")
        to_time = self.request.query_params.get("to")
        if from_time:
            queryset = queryset.filter(end_time__gte=from_time)
        if to_time:
            queryset = queryset.filter(start_time__lte=to_time)
        return queryset.order_by("-start_time")
