from datetime import timedelta

import pytest
from django.utils import timezone

from readings.models import SensorReading
from tests.conftest import reading_payload

pytestmark = pytest.mark.django_db


def test_single_reading_is_validated_and_persisted(authenticated_client, device):
    response = authenticated_client.post("/api/readings/", reading_payload(device), format="json")
    assert response.status_code == 201
    assert SensorReading.objects.filter(device=device).count() == 1
    device.refresh_from_db()
    assert device.last_seen_at is not None


@pytest.mark.parametrize(
    ("field", "value"),
    [("flow_rate_lpm", "-0.1"), ("cumulative_volume_l", "-1"), ("battery_voltage", "-0.5")],
)
def test_negative_values_are_rejected(authenticated_client, device, field, value):
    payload = reading_payload(device)
    payload[field] = value
    response = authenticated_client.post("/api/readings/", payload, format="json")
    assert response.status_code == 400
    assert response.json()["code"] == "validation_error"


def test_future_timestamp_is_rejected(authenticated_client, device):
    payload = reading_payload(device, timezone.now() + timedelta(minutes=10))
    response = authenticated_client.post("/api/readings/", payload, format="json")
    assert response.status_code == 400
    assert response.json()["code"] == "future_timestamp"


def test_unknown_device_is_rejected(authenticated_client, device):
    payload = reading_payload(device)
    payload["device_id"] = "UNKNOWN"
    response = authenticated_client.post("/api/readings/", payload, format="json")
    assert response.status_code == 400
    assert response.json()["code"] == "unknown_device"


def test_duplicate_returns_conflict(authenticated_client, device):
    timestamp = timezone.now()
    payload = reading_payload(device, timestamp)
    assert authenticated_client.post("/api/readings/", payload, format="json").status_code == 201
    response = authenticated_client.post("/api/readings/", payload, format="json")
    assert response.status_code == 409
    assert response.json()["code"] == "duplicate_reading"


def test_decreasing_cumulative_volume_is_rejected(authenticated_client, device):
    now = timezone.now()
    authenticated_client.post(
        "/api/readings/",
        reading_payload(device, now - timedelta(minutes=10), cumulative="1000"),
        format="json",
    )
    response = authenticated_client.post(
        "/api/readings/", reading_payload(device, now, cumulative="999"), format="json"
    )
    assert response.status_code == 400
    assert response.json()["code"] == "decreasing_cumulative_volume"


def test_bulk_reports_partial_success(authenticated_client, device):
    now = timezone.now()
    good = reading_payload(device, now)
    bad = reading_payload(device, now + timedelta(minutes=10))
    response = authenticated_client.post(
        "/api/readings/bulk/", {"readings": [good, bad]}, format="json"
    )
    assert response.status_code == 207
    assert response.json()["accepted"] == 1
    assert response.json()["rejected"] == 1
    assert SensorReading.objects.count() == 1


def test_ingestion_requires_authentication(api_client, device):
    response = api_client.post("/api/readings/", reading_payload(device), format="json")
    assert response.status_code in {401, 403}
