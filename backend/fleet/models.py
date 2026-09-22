from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


def validate_iana_timezone(value: str) -> None:
    try:
        ZoneInfo(value)
    except ZoneInfoNotFoundError as exc:
        raise ValidationError("Enter a valid IANA timezone name.") from exc


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Site(TimestampedModel):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=32, unique=True)
    location = models.CharField(max_length=200)
    timezone = models.CharField(max_length=64, default="UTC", validators=[validate_iana_timezone])

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class Device(TimestampedModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        OFFLINE = "OFFLINE", "Offline"
        MAINTENANCE = "MAINTENANCE", "Maintenance"
        DECOMMISSIONED = "DECOMMISSIONED", "Decommissioned"

    class DeviceType(models.TextChoices):
        WATER_METER = "WATER_METER", "Water meter"
        FLOW_SENSOR = "FLOW_SENSOR", "Flow sensor"

    site = models.ForeignKey(Site, on_delete=models.PROTECT, related_name="devices")
    serial_number = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=120)
    device_type = models.CharField(
        max_length=32, choices=DeviceType.choices, default=DeviceType.WATER_METER
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    installed_at = models.DateTimeField()
    last_seen_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["site__name", "name"]
        indexes = [models.Index(fields=["site", "status"], name="device_site_status_idx")]
        constraints = [
            models.CheckConstraint(
                condition=Q(last_seen_at__isnull=True)
                | Q(last_seen_at__gte=models.F("installed_at")),
                name="device_last_seen_after_install",
            )
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.serial_number})"
