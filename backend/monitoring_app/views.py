from datetime import timedelta

from django.conf import settings
from django.db import connection
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from fleet.models import Device

from .metrics import ACTIVE_DEVICES, STALE_DEVICES


def health(_request):
    return JsonResponse({"status": "healthy"})


def ready(_request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        return JsonResponse({"status": "not_ready", "database": "unavailable"}, status=503)
    return JsonResponse({"status": "ready", "database": "available"})


def metrics(_request):
    stale_before = timezone.now() - timedelta(minutes=settings.DEVICE_STALE_MINUTES)
    ACTIVE_DEVICES.set(
        Device.objects.filter(status=Device.Status.ACTIVE, last_seen_at__gte=stale_before).count()
    )
    STALE_DEVICES.set(
        Device.objects.filter(status=Device.Status.ACTIVE, last_seen_at__lt=stale_before).count()
    )
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)
