from datetime import timedelta
from decimal import Decimal

import pytest
from django.test import override_settings
from django.utils import timezone

from anomalies.models import Anomaly
from anomalies.services import detect_for_device
from readings.models import SensorReading

pytestmark = pytest.mark.django_db


def add_readings(device, flows, spacing_minutes=10):
    start = timezone.now() - timedelta(hours=2)
    cumulative = Decimal("100")
    for index, flow in enumerate(flows):
        cumulative += Decimal(str(flow * spacing_minutes))
        SensorReading.objects.create(
            device=device,
            timestamp=start + timedelta(minutes=index * spacing_minutes),
            flow_rate_lpm=flow,
            cumulative_volume_l=cumulative,
        )


@override_settings(
    ANOMALY_FLOW_THRESHOLD_LPM=2.0,
    ANOMALY_CONTINUOUS_MINUTES=30,
    ANOMALY_MAX_READING_GAP_MINUTES=20,
)
def test_normal_readings_do_not_create_continuous_flow(device):
    add_readings(device, [0.2, 1.0, 1.8, 0.0, 1.2])
    detect_for_device(device)
    assert not Anomaly.objects.filter(anomaly_type=Anomaly.Type.CONTINUOUS_FLOW).exists()


@override_settings(
    ANOMALY_FLOW_THRESHOLD_LPM=2.0,
    ANOMALY_CONTINUOUS_MINUTES=30,
    ANOMALY_MAX_READING_GAP_MINUTES=20,
)
def test_continuous_flow_at_duration_boundary_is_detected(device):
    add_readings(device, [2.1, 2.2, 2.3, 2.4])
    detect_for_device(device)
    anomaly = Anomaly.objects.get(anomaly_type=Anomaly.Type.CONTINUOUS_FLOW)
    assert anomaly.end_time - anomaly.start_time == timedelta(minutes=30)


@override_settings(
    ANOMALY_FLOW_THRESHOLD_LPM=2.0,
    ANOMALY_CONTINUOUS_MINUTES=30,
    ANOMALY_MAX_READING_GAP_MINUTES=20,
)
def test_threshold_is_strictly_greater(device):
    add_readings(device, [2.0, 2.0, 2.0, 2.0])
    detect_for_device(device)
    assert Anomaly.objects.count() == 0


@override_settings(
    ANOMALY_FLOW_THRESHOLD_LPM=2.0,
    ANOMALY_CONTINUOUS_MINUTES=30,
    ANOMALY_MAX_READING_GAP_MINUTES=20,
)
def test_long_gap_is_flagged(device):
    add_readings(device, [0.2, 0.3], spacing_minutes=30)
    detect_for_device(device)
    assert Anomaly.objects.filter(anomaly_type=Anomaly.Type.READING_GAP).count() == 1
