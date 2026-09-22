from prometheus_client import Counter, Gauge, Histogram

HTTP_REQUESTS = Counter(
    "water_http_requests_total", "HTTP requests handled", ["method", "route", "status"]
)
HTTP_LATENCY = Histogram(
    "water_http_request_duration_seconds", "HTTP request duration", ["method", "route"]
)
HTTP_ERRORS = Counter(
    "water_http_errors_total",
    "HTTP responses with a 4xx or 5xx status",
    ["method", "route", "status"],
)
READINGS_INGESTED = Counter("sensor_readings_ingested_total", "Accepted sensor readings")
READINGS_REJECTED = Counter(
    "sensor_readings_rejected_total", "Rejected sensor readings", ["reason"]
)
READING_DUPLICATES = Counter("sensor_reading_duplicates_total", "Duplicate sensor readings")
ANOMALIES_DETECTED = Counter("anomalies_detected_total", "Detected anomalies", ["type", "severity"])
ACTIVE_DEVICES = Gauge("active_devices", "Devices currently marked active")
STALE_DEVICES = Gauge("stale_devices", "Active devices whose last reading is stale")
