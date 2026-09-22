from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from readings.models import SensorReading

pytestmark = pytest.mark.django_db


def create_series(device):
    start = timezone.now().replace(minute=0, second=0, microsecond=0) - timedelta(hours=3)
    rows = []
    cumulative = Decimal("1000")
    for index in range(13):
        cumulative += Decimal("15")
        rows.append(
            SensorReading(
                device=device,
                timestamp=start + timedelta(minutes=index * 15),
                flow_rate_lpm=Decimal("1.0"),
                cumulative_volume_l=cumulative,
            )
        )
    SensorReading.objects.bulk_create(rows)
    return start


def test_hourly_usage_is_aggregated_by_database(api_client, device):
    start = create_series(device)
    response = api_client.get(
        "/api/analytics/usage/",
        {
            "device_id": device.serial_number,
            "from": start.isoformat(),
            "to": (start + timedelta(hours=4)).isoformat(),
            "bucket": "1h",
        },
    )
    assert response.status_code == 200
    assert 3 <= len(response.json()["points"]) <= 4
    assert response.json()["points"][0]["average_flow_rate_lpm"] == 1.0


def test_daily_consumption_returns_bounded_series(api_client, device):
    start = create_series(device)
    response = api_client.get(
        "/api/analytics/daily-consumption/",
        {
            "device_id": device.serial_number,
            "from": start.isoformat(),
            "to": (start + timedelta(days=1)).isoformat(),
        },
    )
    assert response.status_code == 200
    assert response.json()["points"]
    assert response.json()["points"][0]["volume_liters"] > 0


def test_invalid_bucket_is_rejected(api_client, device):
    response = api_client.get(
        "/api/analytics/usage/", {"device_id": device.serial_number, "bucket": "10s"}
    )
    assert response.status_code == 400


def test_excessive_range_is_rejected(api_client, device):
    end = timezone.now()
    response = api_client.get(
        "/api/analytics/usage/",
        {"from": (end - timedelta(days=100)).isoformat(), "to": end.isoformat()},
    )
    assert response.status_code == 400
