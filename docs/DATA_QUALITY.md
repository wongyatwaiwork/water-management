# Data quality decisions

Sensor telemetry is treated as an immutable observation stream. Suspicious values are never silently
rewritten. The ingestion API either rejects a record with a stable code or stores the valid record
and creates a transparent anomaly.

| Condition | Decision | API behavior |
| --- | --- | --- |
| Missing required field | Reject | `400 validation_error` with field details |
| Unknown device serial | Reject | `400 unknown_device` |
| Invalid timestamp syntax | Reject | `400 validation_error` |
| Timestamp over five minutes in the future | Reject | `400 future_timestamp` |
| Negative flow, cumulative volume, or battery voltage | Reject | `400 validation_error`; database checks are defense in depth |
| Duplicate device/timestamp | Reject | `409 duplicate_reading`; duplicate metric increments |
| Cumulative volume below the preceding reading | Reject | `400 decreasing_cumulative_volume` |
| Reading gap over the configured limit | Preserve readings and flag | `READING_GAP` anomaly |
| Sustained flow over the configured threshold/duration | Preserve readings and flag | `CONTINUOUS_FLOW` anomaly |
| Active device not seen within the stale window | Preserve status and expose derived state | `is_stale: true` and stale gauge |

Bulk ingestion returns one result per original array index. Valid records in a mixed batch are kept;
invalid records are reported rather than causing the entire batch to disappear. This is intentional
for intermittent IoT connections, while still making partial acceptance explicit with HTTP `207`.

The demonstration does not currently infer meter resets. A decreasing cumulative value is rejected
and requires an operator or future reset-specific workflow to classify it.
