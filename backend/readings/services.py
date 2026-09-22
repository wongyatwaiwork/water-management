from django.db import transaction

from anomalies.services import detect_for_device
from monitoring_app.metrics import READINGS_INGESTED


@transaction.atomic
def save_reading(serializer, *, run_detection: bool = True):
    reading = serializer.save()
    device = reading.device
    if device.last_seen_at is None or reading.timestamp > device.last_seen_at:
        device.last_seen_at = reading.timestamp
        device.save(update_fields=["last_seen_at", "updated_at"])
    READINGS_INGESTED.inc()
    if run_detection:
        detect_for_device(device)
    return reading
