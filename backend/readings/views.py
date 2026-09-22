from collections import defaultdict

from django.db import IntegrityError, transaction
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from monitoring_app.metrics import READING_DUPLICATES, READINGS_REJECTED

from .models import SensorReading
from .serializers import (
    BulkReadingRequestSerializer,
    BulkReadingResponseSerializer,
    SensorReadingSerializer,
)
from .services import save_reading


def _error_code(errors) -> str:
    text = str(errors).lower()
    if "already exists" in text or "duplicate" in text or "unique set" in text:
        return "duplicate_reading"
    if "does not exist" in text:
        return "unknown_device"
    if "future" in text:
        return "future_timestamp"
    if "cumulative" in text and "lower" in text:
        return "decreasing_cumulative_volume"
    return "validation_error"


class SensorReadingViewSet(mixins.CreateModelMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = SensorReadingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = SensorReading.objects.select_related("device", "device__site")
        device_id = self.request.query_params.get("device_id")
        site_id = self.request.query_params.get("site_id")
        from_time = self.request.query_params.get("from")
        to_time = self.request.query_params.get("to")
        if device_id:
            queryset = queryset.filter(device__serial_number=device_id)
        if site_id:
            queryset = queryset.filter(device__site_id=site_id)
        if from_time:
            queryset = queryset.filter(timestamp__gte=from_time)
        if to_time:
            queryset = queryset.filter(timestamp__lte=to_time)
        return queryset.order_by("-timestamp")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            code = _error_code(serializer.errors)
            READINGS_REJECTED.labels(reason=code).inc()
            if code == "duplicate_reading":
                READING_DUPLICATES.inc()
            return Response(
                {"code": code, "details": serializer.errors},
                status=status.HTTP_409_CONFLICT
                if code == "duplicate_reading"
                else status.HTTP_400_BAD_REQUEST,
            )
        try:
            reading = save_reading(serializer)
        except IntegrityError:
            READING_DUPLICATES.inc()
            READINGS_REJECTED.labels(reason="duplicate_reading").inc()
            return Response({"code": "duplicate_reading"}, status=status.HTTP_409_CONFLICT)
        return Response(self.get_serializer(reading).data, status=status.HTTP_201_CREATED)


class BulkReadingView(APIView):
    permission_classes = [IsAuthenticated]
    max_batch_size = 1000

    @extend_schema(
        request=BulkReadingRequestSerializer,
        responses={201: BulkReadingResponseSerializer, 207: BulkReadingResponseSerializer},
    )
    def post(self, request):
        payload = request.data.get("readings") if isinstance(request.data, dict) else request.data
        if not isinstance(payload, list):
            return Response(
                {"code": "invalid_payload", "details": "Expected a list or a readings list."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not payload or len(payload) > self.max_batch_size:
            return Response(
                {
                    "code": "invalid_batch_size",
                    "details": f"Batch size must be 1–{self.max_batch_size}.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = []
        devices = defaultdict(bool)
        accepted = 0
        for index, item in enumerate(payload):
            serializer = SensorReadingSerializer(data=item)
            if not serializer.is_valid():
                code = _error_code(serializer.errors)
                READINGS_REJECTED.labels(reason=code).inc()
                if code == "duplicate_reading":
                    READING_DUPLICATES.inc()
                results.append(
                    {
                        "index": index,
                        "status": "rejected",
                        "code": code,
                        "details": serializer.errors,
                    }
                )
                continue
            try:
                with transaction.atomic():
                    reading = save_reading(serializer, run_detection=False)
            except IntegrityError:
                READING_DUPLICATES.inc()
                READINGS_REJECTED.labels(reason="duplicate_reading").inc()
                results.append({"index": index, "status": "rejected", "code": "duplicate_reading"})
                continue
            accepted += 1
            devices[reading.device_id] = True
            results.append({"index": index, "status": "accepted", "id": reading.id})

        from anomalies.services import detect_for_device
        from fleet.models import Device

        for device in Device.objects.filter(id__in=devices):
            detect_for_device(device)
        response_status = (
            status.HTTP_201_CREATED if accepted == len(payload) else status.HTTP_207_MULTI_STATUS
        )
        return Response(
            {"accepted": accepted, "rejected": len(payload) - accepted, "results": results},
            status=response_status,
        )
