from django.db import models
from django.db.models import Q

from fleet.models import Device


class SensorReading(models.Model):
    device = models.ForeignKey(Device, on_delete=models.PROTECT, related_name="readings")
    timestamp = models.DateTimeField()
    flow_rate_lpm = models.DecimalField(max_digits=10, decimal_places=3)
    cumulative_volume_l = models.DecimalField(max_digits=16, decimal_places=3)
    battery_voltage = models.DecimalField(max_digits=5, decimal_places=3, null=True, blank=True)
    signal_strength = models.SmallIntegerField(null=True, blank=True)
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        constraints = [
            models.UniqueConstraint(
                fields=["device", "timestamp"], name="unique_device_reading_timestamp"
            ),
            models.CheckConstraint(
                condition=Q(flow_rate_lpm__gte=0), name="reading_flow_nonnegative"
            ),
            models.CheckConstraint(
                condition=Q(cumulative_volume_l__gte=0), name="reading_volume_nonnegative"
            ),
            models.CheckConstraint(
                condition=Q(battery_voltage__isnull=True) | Q(battery_voltage__gte=0),
                name="reading_battery_nonnegative",
            ),
        ]
        indexes = [models.Index(fields=["device", "timestamp"], name="reading_device_time_idx")]

    def __str__(self) -> str:
        return f"{self.device.serial_number} @ {self.timestamp.isoformat()}"
