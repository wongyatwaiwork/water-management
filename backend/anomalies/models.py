from django.db import models
from django.db.models import Q

from fleet.models import Device


class Anomaly(models.Model):
    class Type(models.TextChoices):
        CONTINUOUS_FLOW = "CONTINUOUS_FLOW", "Continuous flow"
        HIGH_FLOW = "HIGH_FLOW", "High flow"
        READING_GAP = "READING_GAP", "Reading gap"
        INVALID_READING = "INVALID_READING", "Invalid reading"

    class Severity(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        ACKNOWLEDGED = "ACKNOWLEDGED", "Acknowledged"
        RESOLVED = "RESOLVED", "Resolved"

    device = models.ForeignKey(Device, on_delete=models.PROTECT, related_name="anomalies")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    anomaly_type = models.CharField(max_length=32, choices=Type.choices)
    severity = models.CharField(max_length=12, choices=Severity.choices)
    description = models.TextField()
    detected_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)

    class Meta:
        ordering = ["-start_time"]
        constraints = [
            models.CheckConstraint(
                condition=Q(end_time__isnull=True) | Q(end_time__gte=models.F("start_time")),
                name="anomaly_end_after_start",
            ),
            models.UniqueConstraint(
                fields=["device", "start_time", "anomaly_type"],
                name="unique_device_anomaly_start_type",
            ),
        ]
        indexes = [models.Index(fields=["device", "start_time"], name="anomaly_device_time_idx")]

    def __str__(self) -> str:
        return f"{self.get_anomaly_type_display()} — {self.device.serial_number}"
