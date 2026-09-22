from datetime import timedelta
from decimal import Decimal

from django.conf import settings

from monitoring_app.metrics import ANOMALIES_DETECTED

from .models import Anomaly


def _record_anomaly(*, device, start_time, end_time, anomaly_type, severity, description):
    anomaly, created = Anomaly.objects.update_or_create(
        device=device,
        start_time=start_time,
        anomaly_type=anomaly_type,
        defaults={"end_time": end_time, "severity": severity, "description": description},
    )
    if created:
        ANOMALIES_DETECTED.labels(type=anomaly_type, severity=severity).inc()
    return anomaly, created


def detect_for_device(device, *, from_time=None, to_time=None) -> list[Anomaly]:
    """Run transparent flow and gap rules over a device's ordered immutable readings."""
    queryset = device.readings.order_by("timestamp")
    if from_time:
        queryset = queryset.filter(timestamp__gte=from_time)
    if to_time:
        queryset = queryset.filter(timestamp__lte=to_time)
    readings = list(queryset.only("timestamp", "flow_rate_lpm"))
    if len(readings) < 2:
        return []

    threshold = Decimal(str(settings.ANOMALY_FLOW_THRESHOLD_LPM))
    required = timedelta(minutes=settings.ANOMALY_CONTINUOUS_MINUTES)
    maximum_gap = timedelta(minutes=settings.ANOMALY_MAX_READING_GAP_MINUTES)
    detected: list[Anomaly] = []
    sequence_start = readings[0].timestamp if readings[0].flow_rate_lpm > threshold else None
    sequence_end = readings[0].timestamp if sequence_start else None
    previous = readings[0]

    def finish_sequence() -> None:
        nonlocal sequence_start, sequence_end
        if sequence_start and sequence_end and sequence_end - sequence_start >= required:
            duration_minutes = int((sequence_end - sequence_start).total_seconds() / 60)
            severity = (
                Anomaly.Severity.HIGH
                if sequence_end - sequence_start >= required * 4
                else Anomaly.Severity.MEDIUM
            )
            anomaly, _ = _record_anomaly(
                device=device,
                start_time=sequence_start,
                end_time=sequence_end,
                anomaly_type=Anomaly.Type.CONTINUOUS_FLOW,
                severity=severity,
                description=(
                    f"Flow remained above {threshold} L/min for {duration_minutes} minutes. "
                    "This is a demonstration rule and requires investigation."
                ),
            )
            detected.append(anomaly)
        sequence_start = None
        sequence_end = None

    for reading in readings[1:]:
        gap = reading.timestamp - previous.timestamp
        if gap > maximum_gap:
            finish_sequence()
            anomaly, _ = _record_anomaly(
                device=device,
                start_time=previous.timestamp,
                end_time=reading.timestamp,
                anomaly_type=Anomaly.Type.READING_GAP,
                severity=Anomaly.Severity.LOW,
                description=f"No reading was received for {int(gap.total_seconds() / 60)} minutes.",
            )
            detected.append(anomaly)

        if reading.flow_rate_lpm > threshold:
            if sequence_start is None:
                sequence_start = reading.timestamp
            sequence_end = reading.timestamp
        else:
            finish_sequence()
        previous = reading

    finish_sequence()
    return detected
