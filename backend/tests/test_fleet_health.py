from datetime import timedelta

import pytest
from django.utils import timezone

from fleet.models import Device

pytestmark = pytest.mark.django_db


def test_device_filters(api_client, site, device):
    Device.objects.create(
        site=site,
        serial_number="WM-OFF",
        name="Offline",
        status=Device.Status.OFFLINE,
        installed_at=timezone.now() - timedelta(days=2),
    )
    response = api_client.get("/api/devices/", {"status": "OFFLINE", "site": site.id})
    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert response.json()["results"][0]["serial_number"] == "WM-OFF"


def test_health_and_readiness(api_client):
    assert api_client.get("/api/health/").json() == {"status": "healthy"}
    response = api_client.get("/api/ready/")
    assert response.status_code == 200
    assert response.json()["database"] == "available"
