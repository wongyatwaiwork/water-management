export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Site {
  id: number
  name: string
  code: string
  location: string
  timezone: string
  device_count: number
}

export type DeviceStatus = 'ACTIVE' | 'OFFLINE' | 'MAINTENANCE' | 'DECOMMISSIONED'

export interface Device {
  id: number
  site: number
  site_name: string
  site_code: string
  serial_number: string
  name: string
  device_type: string
  status: DeviceStatus
  installed_at: string
  last_seen_at: string | null
  latest_flow_rate_lpm: string | null
  latest_battery_voltage: string | null
  latest_reading_at: string | null
  is_stale: boolean
}

export interface UsagePoint {
  timestamp: string
  volume_liters: number
  average_flow_rate_lpm: number
  max_flow_rate_lpm: number
}

export interface UsageSeries {
  device_id: string | null
  site_id: string | null
  from: string
  to: string
  bucket: '5m' | '1h' | '1d'
  points: UsagePoint[]
}

export interface DailyPoint {
  date: string
  volume_liters: number
}
export interface DailySeries {
  from: string
  to: string
  points: DailyPoint[]
}
export interface HeatmapPoint {
  day_of_week: number
  hour: number
  average_flow_rate_lpm: number
}
export interface HeatmapSeries {
  from: string
  to: string
  points: HeatmapPoint[]
}

export interface Summary {
  today_usage_liters: number
  current_total_flow_lpm: number
  active_devices: number
  offline_or_stale_devices: number
  open_anomalies: number
  generated_at: string
}

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH'
export interface Anomaly {
  id: number
  device: number
  device_name: string
  device_serial_number: string
  site_id: number
  site_name: string
  start_time: string
  end_time: string | null
  anomaly_type: 'CONTINUOUS_FLOW' | 'HIGH_FLOW' | 'READING_GAP' | 'INVALID_READING'
  severity: AnomalySeverity
  description: string
  detected_at: string
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
}
