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

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function get<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const query = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  const response = await fetch(`${API_BASE}${path}${query.size ? `?${query}` : ''}`)
  if (!response.ok) throw new ApiError(response.status, `Request failed (${response.status})`)
  return response.json() as Promise<T>
}

export const api = {
  summary: () => get<Summary>('/analytics/summary/'),
  sites: () => get<Paginated<Site>>('/sites/'),
  devices: (filters?: { site?: number; status?: string; device_type?: string }) =>
    get<Paginated<Device>>('/devices/', filters),
  usage: (params: {
    device_id?: string
    site_id?: number
    from: string
    to: string
    bucket: string
  }) => get<UsageSeries>('/analytics/usage/', params),
  daily: (params: { device_id?: string; site_id?: number; from: string; to: string }) =>
    get<DailySeries>('/analytics/daily-consumption/', params),
  heatmap: (params: { device_id?: string; site_id?: number; from: string; to: string }) =>
    get<HeatmapSeries>('/analytics/heatmap/', params),
  anomalies: (params?: { device?: string; site?: number; severity?: string; type?: string }) =>
    get<Paginated<Anomaly>>('/anomalies/', params),
  anomaly: (id: number) => get<Anomaly>(`/anomalies/${id}/`),
}
