import type {
  Anomaly,
  DailySeries,
  Device,
  HeatmapSeries,
  Paginated,
  Site,
  Summary,
  UsageSeries,
} from '../types/api'

const minute = 60_000
const hour = 60 * minute
const day = 24 * hour

const sites: Site[] = [
  {
    id: 1,
    name: 'Harbour Exchange',
    code: 'HEX',
    location: 'Central business district',
    timezone: 'Asia/Hong_Kong',
    device_count: 3,
  },
  {
    id: 2,
    name: 'Northside Campus',
    code: 'NSC',
    location: 'Education precinct',
    timezone: 'Asia/Hong_Kong',
    device_count: 2,
  },
  {
    id: 3,
    name: 'Riverside Apartments',
    code: 'RSA',
    location: 'Residential district',
    timezone: 'Asia/Hong_Kong',
    device_count: 2,
  },
]

const isoAgo = (milliseconds: number) => new Date(Date.now() - milliseconds).toISOString()

const devices: Device[] = [
  {
    id: 1,
    site: 1,
    site_name: sites[0].name,
    site_code: sites[0].code,
    serial_number: 'WM-001',
    name: 'Main inlet',
    device_type: 'WATER_METER',
    status: 'ACTIVE',
    installed_at: '2025-11-12T08:00:00Z',
    last_seen_at: isoAgo(3 * minute),
    latest_flow_rate_lpm: '3.82',
    latest_battery_voltage: '3.71',
    latest_reading_at: isoAgo(3 * minute),
    is_stale: false,
  },
  {
    id: 2,
    site: 1,
    site_name: sites[0].name,
    site_code: sites[0].code,
    serial_number: 'WM-002',
    name: 'Cooling loop',
    device_type: 'WATER_METER',
    status: 'ACTIVE',
    installed_at: '2025-11-12T08:00:00Z',
    last_seen_at: isoAgo(7 * minute),
    latest_flow_rate_lpm: '1.46',
    latest_battery_voltage: '3.64',
    latest_reading_at: isoAgo(7 * minute),
    is_stale: false,
  },
  {
    id: 3,
    site: 1,
    site_name: sites[0].name,
    site_code: sites[0].code,
    serial_number: 'WM-003',
    name: 'Retail supply',
    device_type: 'WATER_METER',
    status: 'MAINTENANCE',
    installed_at: '2025-12-03T08:00:00Z',
    last_seen_at: isoAgo(4 * hour),
    latest_flow_rate_lpm: '0.00',
    latest_battery_voltage: '3.55',
    latest_reading_at: isoAgo(4 * hour),
    is_stale: true,
  },
  {
    id: 4,
    site: 2,
    site_name: sites[1].name,
    site_code: sites[1].code,
    serial_number: 'WM-004',
    name: 'Science block',
    device_type: 'WATER_METER',
    status: 'ACTIVE',
    installed_at: '2026-01-08T08:00:00Z',
    last_seen_at: isoAgo(5 * minute),
    latest_flow_rate_lpm: '2.18',
    latest_battery_voltage: '3.76',
    latest_reading_at: isoAgo(5 * minute),
    is_stale: false,
  },
  {
    id: 5,
    site: 2,
    site_name: sites[1].name,
    site_code: sites[1].code,
    serial_number: 'WM-005',
    name: 'Sports centre',
    device_type: 'WATER_METER',
    status: 'OFFLINE',
    installed_at: '2026-01-08T08:00:00Z',
    last_seen_at: isoAgo(29 * hour),
    latest_flow_rate_lpm: '0.00',
    latest_battery_voltage: '3.22',
    latest_reading_at: isoAgo(29 * hour),
    is_stale: true,
  },
  {
    id: 6,
    site: 3,
    site_name: sites[2].name,
    site_code: sites[2].code,
    serial_number: 'WM-006',
    name: 'Tower A inlet',
    device_type: 'WATER_METER',
    status: 'ACTIVE',
    installed_at: '2026-02-14T08:00:00Z',
    last_seen_at: isoAgo(2 * minute),
    latest_flow_rate_lpm: '4.05',
    latest_battery_voltage: '3.69',
    latest_reading_at: isoAgo(2 * minute),
    is_stale: false,
  },
  {
    id: 7,
    site: 3,
    site_name: sites[2].name,
    site_code: sites[2].code,
    serial_number: 'WM-007',
    name: 'Tower B inlet',
    device_type: 'WATER_METER',
    status: 'ACTIVE',
    installed_at: '2026-02-14T08:00:00Z',
    last_seen_at: isoAgo(8 * minute),
    latest_flow_rate_lpm: '3.37',
    latest_battery_voltage: '3.73',
    latest_reading_at: isoAgo(8 * minute),
    is_stale: false,
  },
]

const anomalies: Anomaly[] = [
  {
    id: 101,
    device: 1,
    device_name: devices[0].name,
    device_serial_number: devices[0].serial_number,
    site_id: 1,
    site_name: sites[0].name,
    start_time: isoAgo(8.5 * hour),
    end_time: isoAgo(7.6 * hour),
    anomaly_type: 'CONTINUOUS_FLOW',
    severity: 'HIGH',
    description: 'Flow remained above 2.0 L/min for 54 minutes outside the normal demand profile.',
    detected_at: isoAgo(7.5 * hour),
    status: 'OPEN',
  },
  {
    id: 102,
    device: 5,
    device_name: devices[4].name,
    device_serial_number: devices[4].serial_number,
    site_id: 2,
    site_name: sites[1].name,
    start_time: isoAgo(29 * hour),
    end_time: null,
    anomaly_type: 'READING_GAP',
    severity: 'MEDIUM',
    description: 'No telemetry has arrived for more than 20 minutes; the device is now offline.',
    detected_at: isoAgo(28.5 * hour),
    status: 'ACKNOWLEDGED',
  },
  {
    id: 103,
    device: 6,
    device_name: devices[5].name,
    device_serial_number: devices[5].serial_number,
    site_id: 3,
    site_name: sites[2].name,
    start_time: isoAgo(3.2 * day),
    end_time: isoAgo(3.15 * day),
    anomaly_type: 'HIGH_FLOW',
    severity: 'MEDIUM',
    description: 'Peak flow exceeded the configured high-flow threshold during the overnight window.',
    detected_at: isoAgo(3.14 * day),
    status: 'RESOLVED',
  },
  {
    id: 104,
    device: 3,
    device_name: devices[2].name,
    device_serial_number: devices[2].serial_number,
    site_id: 1,
    site_name: sites[0].name,
    start_time: isoAgo(4.1 * hour),
    end_time: null,
    anomaly_type: 'READING_GAP',
    severity: 'LOW',
    description: 'Telemetry paused while the meter is in its scheduled maintenance window.',
    detected_at: isoAgo(3.7 * hour),
    status: 'OPEN',
  },
]

const paginated = <T>(results: T[]): Paginated<T> => ({
  count: results.length,
  next: null,
  previous: null,
  results,
})

const delay = async <T>(value: T): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, 90))
  return value
}

const flowFactor = (deviceId?: string, siteId?: number) => {
  if (siteId) return 0.95 + siteId * 0.16
  const index = devices.findIndex((device) => device.serial_number === deviceId)
  return index < 0 ? 1 : 0.78 + index * 0.08
}

function usageSeries(params: {
  device_id?: string
  site_id?: number
  from: string
  to: string
  bucket: string
}): UsageSeries {
  const from = new Date(params.from).getTime()
  const to = new Date(params.to).getTime()
  const step = params.bucket === '5m' ? 5 * minute : params.bucket === '1h' ? hour : day
  const count = Math.min(400, Math.max(1, Math.ceil((to - from) / step)))
  const factor = flowFactor(params.device_id, params.site_id)
  const points = Array.from({ length: count }, (_, index) => {
    const timestamp = Math.min(to, from + index * step)
    const date = new Date(timestamp)
    const hourOfDay = date.getHours() + date.getMinutes() / 60
    const morning = Math.exp(-Math.pow((hourOfDay - 8) / 2.25, 2)) * 3.4
    const evening = Math.exp(-Math.pow((hourOfDay - 19) / 2.7, 2)) * 2.8
    const baseline = 0.38 + 0.17 * Math.sin(index * 0.71) + 0.1 * Math.cos(index * 0.19)
    const incident = timestamp > Date.now() - 8.5 * hour && timestamp < Date.now() - 7.6 * hour ? 2.3 : 0
    const average = Math.max(0.05, (baseline + morning + evening + incident) * factor)
    return {
      timestamp: new Date(timestamp).toISOString(),
      volume_liters: Number((average * (step / minute)).toFixed(2)),
      average_flow_rate_lpm: Number(average.toFixed(2)),
      max_flow_rate_lpm: Number((average * 1.28).toFixed(2)),
    }
  })
  return {
    device_id: params.device_id ?? null,
    site_id: params.site_id ? String(params.site_id) : null,
    from: params.from,
    to: params.to,
    bucket: params.bucket as UsageSeries['bucket'],
    points,
  }
}

function dailySeries(params: { from: string; to: string; device_id?: string; site_id?: number }): DailySeries {
  const from = new Date(params.from).getTime()
  const to = new Date(params.to).getTime()
  const count = Math.min(31, Math.max(1, Math.ceil((to - from) / day)))
  const factor = flowFactor(params.device_id, params.site_id)
  return {
    from: params.from,
    to: params.to,
    points: Array.from({ length: count }, (_, index) => ({
      date: new Date(from + index * day).toISOString(),
      volume_liters: Number(((1180 + 165 * Math.sin(index * 0.83) + (index % 7 < 5 ? 190 : -80)) * factor).toFixed(1)),
    })),
  }
}

function heatmapSeries(params: { from: string; to: string; device_id?: string; site_id?: number }): HeatmapSeries {
  const factor = flowFactor(params.device_id, params.site_id)
  return {
    from: params.from,
    to: params.to,
    points: Array.from({ length: 7 * 24 }, (_, index) => {
      const dayOfWeek = Math.floor(index / 24)
      const hourOfDay = index % 24
      const morning = Math.exp(-Math.pow((hourOfDay - 8) / 2.3, 2)) * 2.7
      const evening = Math.exp(-Math.pow((hourOfDay - 19) / 2.8, 2)) * 2.2
      const weekday = dayOfWeek < 5 ? 1 : 0.72
      return {
        day_of_week: dayOfWeek,
        hour: hourOfDay,
        average_flow_rate_lpm: Number(((0.3 + morning + evening) * weekday * factor).toFixed(2)),
      }
    }),
  }
}

export const demoApi = {
  summary: () =>
    delay<Summary>({
      today_usage_liters: 8_742.6,
      current_total_flow_lpm: 14.88,
      active_devices: 5,
      offline_or_stale_devices: 2,
      open_anomalies: 3,
      generated_at: new Date().toISOString(),
    }),
  sites: () => delay(paginated(sites)),
  devices: (filters?: { site?: number; status?: string; device_type?: string }) =>
    delay(
      paginated(
        devices.filter(
          (device) =>
            (!filters?.site || device.site === filters.site) &&
            (!filters?.status || device.status === filters.status) &&
            (!filters?.device_type || device.device_type === filters.device_type),
        ),
      ),
    ),
  usage: (params: Parameters<typeof usageSeries>[0]) => delay(usageSeries(params)),
  daily: (params: Parameters<typeof dailySeries>[0]) => delay(dailySeries(params)),
  heatmap: (params: Parameters<typeof heatmapSeries>[0]) => delay(heatmapSeries(params)),
  anomalies: (filters?: { device?: string; site?: number; severity?: string; type?: string }) =>
    delay(
      paginated(
        anomalies.filter(
          (anomaly) =>
            (!filters?.device || anomaly.device_serial_number === filters.device) &&
            (!filters?.site || anomaly.site_id === filters.site) &&
            (!filters?.severity || anomaly.severity === filters.severity) &&
            (!filters?.type || anomaly.anomaly_type === filters.type),
        ),
      ),
    ),
  anomaly: (id: number) => delay(anomalies.find((anomaly) => anomaly.id === id) ?? anomalies[0]),
}
