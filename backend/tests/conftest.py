from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from fleet.models import Device, Site


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return get_user_model().objects.create_user(username="tester", password="test-password-123")


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def site(db):
    return Site.objects.create(
        name="Test Facility", code="TEST", location="Fictional location", timezone="UTC"
    )


@pytest.fixture
def device(site):
    return Device.objects.create(
        site=site,
        serial_number="WM-TEST-001",
        name="Test meter",
        device_type=Device.DeviceType.WATER_METER,
        status=Device.Status.ACTIVE,
        installed_at=timezone.now() - timedelta(days=30),
    )


def reading_payload(device, timestamp=None, flow="1.250", cumulative="1000.000"):
    return {
        "device_id": device.serial_number,
        "timestamp": (timestamp or timezone.now()).isoformat(),
        "flow_rate_lpm": flow,
        "cumulative_volume_l": cumulative,
        "battery_voltage": "3.720",
        "signal_strength": -67,
    }
