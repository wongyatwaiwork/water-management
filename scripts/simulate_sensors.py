#!/usr/bin/env python3
"""Generate deterministic fictional meter readings and submit them in batches."""

import argparse
import json
import math
import random
import sys
from datetime import UTC, datetime, timedelta
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def generate(devices: int, hours: int, interval_minutes: int, seed: int, inject: bool):
    rng = random.Random(seed)
    end = datetime.now(UTC).replace(second=0, microsecond=0) - timedelta(minutes=2)
    start = end - timedelta(hours=hours)
    readings = []
    for index in range(devices):
        serial = f"WM-{index + 1:03d}"
        cumulative = 100_000.0 + index * 10_000
        timestamp = start
        while timestamp <= end:
            hour = timestamp.hour + timestamp.minute / 60
            flow = 0.1 + 1.25 * math.exp(-((hour - 8) ** 2) / 7) + 1.0 * math.exp(-((hour - 18) ** 2) / 8)
            flow = max(0, flow * (0.85 + index * 0.06) + rng.uniform(-0.08, 0.1))
            if inject and index == 0 and end - timedelta(hours=3) <= timestamp <= end - timedelta(hours=2):
                flow = 3.5 + rng.uniform(-0.1, 0.1)
            cumulative += flow * interval_minutes
            readings.append({
                "device_id": serial,
                "timestamp": timestamp.isoformat().replace("+00:00", "Z"),
                "flow_rate_lpm": round(flow, 3),
                "cumulative_volume_l": round(cumulative, 3),
                "battery_voltage": round(3.82 - index * 0.04, 3),
                "signal_strength": -55 - index * 3 + rng.randint(-3, 3),
            })
            timestamp += timedelta(minutes=interval_minutes)
    return sorted(readings, key=lambda item: item["timestamp"])


def submit(api_url: str, token: str, readings: list[dict], batch_size: int) -> None:
    endpoint = f"{api_url.rstrip('/')}/api/readings/bulk/"
    accepted = rejected = 0
    for offset in range(0, len(readings), batch_size):
        body = json.dumps({"readings": readings[offset:offset + batch_size]}).encode()
        request = Request(endpoint, data=body, headers={"Content-Type": "application/json", "Authorization": f"Token {token}"}, method="POST")
        try:
            with urlopen(request, timeout=30) as response:
                result = json.load(response)
        except HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            raise RuntimeError(f"API returned HTTP {exc.code}: {detail}") from exc
        accepted += result["accepted"]
        rejected += result["rejected"]
    print(f"Submitted {len(readings)} readings: {accepted} accepted, {rejected} rejected.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-url", default="http://localhost:8000")
    parser.add_argument("--token", required=True, help="DRF API token for an authorized demo user")
    parser.add_argument("--devices", type=int, default=5, choices=range(1, 8), metavar="1-7")
    parser.add_argument("--hours", type=int, default=48)
    parser.add_argument("--interval-minutes", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=500)
    parser.add_argument("--seed", type=int, default=20260922)
    parser.add_argument("--inject-anomalies", action="store_true")
    args = parser.parse_args()
    try:
        readings = generate(args.devices, args.hours, args.interval_minutes, args.seed, args.inject_anomalies)
        submit(args.api_url, args.token, readings, args.batch_size)
    except (RuntimeError, URLError, ValueError) as exc:
        print(f"Simulator failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

