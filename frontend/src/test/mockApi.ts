import { vi } from 'vitest'

const device = {
  id: 1,
  site: 1,
  site_name: 'Test Site',
  site_code: 'TS',
  serial_number: 'WM-001',
  name: 'Main inlet',
  device_type: 'WATER_METER',
  status: 'ACTIVE',
  installed_at: '2026-01-01T00:00:00Z',
  last_seen_at: new Date().toISOString(),
  latest_flow_rate_lpm: '1.200',
  latest_battery_voltage: '3.700',
  latest_reading_at: new Date().toISOString(),
  is_stale: false,
}

const anomaly = {
  id: 7,
  device: 1,
  device_name: 'Main inlet',
  device_serial_number: 'WM-001',
  site_id: 1,
  site_name: 'Test Site',
  start_time: '2026-09-21T01:00:00Z',
  end_time: '2026-09-21T02:00:00Z',
  anomaly_type: 'CONTINUOUS_FLOW',
  severity: 'MEDIUM',
  description: 'Continuous flow demo rule.',
  detected_at: '2026-09-21T02:01:00Z',
  status: 'OPEN',
}

export function mockApi(options: { failSummary?: boolean; emptyDevices?: boolean } = {}) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes('/analytics/summary/')) {
      if (options.failSummary) return new Response('{}', { status: 500 })
      return Response.json({
        today_usage_liters: 1234,
        current_total_flow_lpm: 4.2,
        active_devices: 5,
        offline_or_stale_devices: 2,
        open_anomalies: 1,
        generated_at: new Date().toISOString(),
      })
    }
    if (url.includes('/sites/'))
      return Response.json({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            name: 'Test Site',
            code: 'TS',
            location: 'Demo',
            timezone: 'UTC',
            device_count: 1,
          },
        ],
      })
    if (url.includes('/devices/'))
      return Response.json({
        count: options.emptyDevices ? 0 : 1,
        next: null,
        previous: null,
        results: options.emptyDevices ? [] : [device],
      })
    if (url.includes('/analytics/usage/'))
      return Response.json({
        device_id: 'WM-001',
        site_id: null,
        from: '2026-09-21T00:00:00Z',
        to: '2026-09-22T00:00:00Z',
        bucket: '5m',
        points: [
          {
            timestamp: '2026-09-21T01:00:00Z',
            volume_liters: 10,
            average_flow_rate_lpm: 1.2,
            max_flow_rate_lpm: 1.5,
          },
        ],
      })
    if (url.includes('/analytics/daily-consumption/'))
      return Response.json({
        from: '2026-09-21T00:00:00Z',
        to: '2026-09-22T00:00:00Z',
        points: [{ date: '2026-09-21T00:00:00Z', volume_liters: 220 }],
      })
    if (url.includes('/analytics/heatmap/'))
      return Response.json({
        from: '2026-09-21T00:00:00Z',
        to: '2026-09-22T00:00:00Z',
        points: [{ day_of_week: 0, hour: 8, average_flow_rate_lpm: 1.2 }],
      })
    if (url.includes('/anomalies/'))
      return Response.json({ count: 1, next: null, previous: null, results: [anomaly] })
    return new Response('{}', { status: 404 })
  })
}
