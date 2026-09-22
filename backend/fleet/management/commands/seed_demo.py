import math
import os
import random
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from rest_framework.authtoken.models import Token

from anomalies.services import detect_for_device
from fleet.models import Device, Site
from readings.models import SensorReading


class Command(BaseCommand):
    help = "Seed deterministic, fictional data for the local portfolio demo."

    def handle(self, *args, **options):
        randomizer = random.Random(20260922)
        now = timezone.now().replace(second=0, microsecond=0)
        password = os.getenv("DEMO_USER_PASSWORD")
        if password:
            user, _ = get_user_model().objects.get_or_create(username="demo")
            user.set_password(password)
            user.save()
            Token.objects.get_or_create(user=user)

        site_specs = [
            ("Riverside Learning Centre", "RLC", "Fictional North District", "Asia/Shanghai"),
            ("Harbour Community Hub", "HCH", "Fictional Waterfront", "Asia/Shanghai"),
            ("Hillview Demonstration Park", "HDP", "Fictional West District", "Asia/Shanghai"),
        ]
        sites = {}
        for name, code, location, timezone_name in site_specs:
            sites[code], _ = Site.objects.update_or_create(
                code=code,
                defaults={"name": name, "location": location, "timezone": timezone_name},
            )

        device_specs = [
            ("WM-001", "Main inlet", "RLC", Device.Status.ACTIVE),
            ("WM-002", "Teaching block", "RLC", Device.Status.ACTIVE),
            ("WM-003", "Kitchen wing", "HCH", Device.Status.ACTIVE),
            ("WM-004", "Garden supply", "HCH", Device.Status.MAINTENANCE),
            ("WM-005", "Irrigation loop", "HDP", Device.Status.ACTIVE),
            ("WM-006", "Visitor facilities", "HDP", Device.Status.OFFLINE),
            ("WM-007", "Workshop meter", "HDP", Device.Status.ACTIVE),
        ]
        devices = []
        for serial, name, site_code, status in device_specs:
            device, _ = Device.objects.update_or_create(
                serial_number=serial,
                defaults={
                    "name": name,
                    "site": sites[site_code],
                    "status": status,
                    "device_type": Device.DeviceType.WATER_METER,
                    "installed_at": now - timedelta(days=120),
                },
            )
            devices.append(device)

        if SensorReading.objects.exists():
            self.stdout.write(
                self.style.WARNING("Telemetry already exists; skipped demo reading generation.")
            )
            return

        start = now - timedelta(days=8)
        interval = timedelta(minutes=15)
        rows = []
        for index, device in enumerate(devices):
            cumulative = Decimal(str(12000 + index * 3100))
            timestamp = start
            if device.status == Device.Status.OFFLINE:
                stop = now - timedelta(days=2)
            elif device.serial_number == "WM-007":
                stop = now - timedelta(hours=6)
            else:
                stop = now
            while timestamp <= stop:
                local_hour = timestamp.hour
                morning = math.exp(-((local_hour - 8) ** 2) / 8)
                evening = math.exp(-((local_hour - 18) ** 2) / 10)
                weekday_factor = 1.0 if timestamp.weekday() < 5 else 0.65
                flow = (0.12 + 1.25 * morning + 1.05 * evening) * weekday_factor
                flow += randomizer.uniform(-0.07, 0.12)
                flow *= 0.8 + index * 0.07
                if device.serial_number == "WM-001" and now - timedelta(
                    hours=20
                ) <= timestamp <= now - timedelta(hours=18):
                    flow = 3.4 + randomizer.uniform(-0.12, 0.18)
                flow = max(0.0, flow)
                cumulative += Decimal(str(flow * 15)).quantize(Decimal("0.001"))
                battery = Decimal(
                    str(3.84 - index * 0.035 - ((timestamp - start).days * 0.002))
                ).quantize(Decimal("0.001"))
                rows.append(
                    SensorReading(
                        device=device,
                        timestamp=timestamp,
                        flow_rate_lpm=Decimal(str(flow)).quantize(Decimal("0.001")),
                        cumulative_volume_l=cumulative,
                        battery_voltage=battery,
                        signal_strength=-52 - index * 3 + randomizer.randint(-4, 4),
                    )
                )
                timestamp += interval

        SensorReading.objects.bulk_create(rows, batch_size=1000)
        for device in devices:
            last = device.readings.order_by("-timestamp").first()
            device.last_seen_at = last.timestamp if last else None
            device.save(update_fields=["last_seen_at", "updated_at"])
            detect_for_device(device)
        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(sites)} sites, {len(devices)} devices, and {len(rows)} fictional readings."
            )
        )
