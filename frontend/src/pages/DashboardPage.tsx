import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { FlowChart } from '../charts/FlowChart'
import { DailyConsumptionChart } from '../charts/DailyConsumptionChart'
import { UsageHeatmap } from '../charts/UsageHeatmap'
import { ErrorState, LoadingState } from '../components/QueryState'
import { SummaryCards } from '../components/SummaryCards'

type Range = '24h' | '7d' | '30d'
const ranges: Record<Range, { days: number; bucket: '5m' | '1h' | '1d' }> = {
  '24h': { days: 1, bucket: '5m' },
  '7d': { days: 7, bucket: '1h' },
  '30d': { days: 30, bucket: '1d' },
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [range, setRange] = useState<Range>('24h')
  const [selectedDevice, setSelectedDevice] = useState(searchParams.get('device') ?? '')
  const [selectedSite, setSelectedSite] = useState<number | ''>('')
  const summary = useQuery({ queryKey: ['summary'], queryFn: api.summary })
  const devices = useQuery({ queryKey: ['devices'], queryFn: () => api.devices() })
  const sites = useQuery({ queryKey: ['sites'], queryFn: api.sites })
  const effectiveDevice = selectedDevice || devices.data?.results[0]?.serial_number || ''
  const hasLinkedWindow = Boolean(searchParams.get('from') && searchParams.get('to'))
  const leaveLinkedWindow = (device: string) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('from')
    nextSearchParams.delete('to')
    if (device) nextSearchParams.set('device', device)
    else nextSearchParams.delete('device')
    setSearchParams(nextSearchParams, { replace: true })
  }
  const dates = useMemo(() => {
    const linkedFrom = searchParams.get('from')
    const linkedTo = searchParams.get('to')
    if (linkedFrom && linkedTo) return { from: linkedFrom, to: linkedTo }
    const to = new Date()
    const from = new Date(to.getTime() - ranges[range].days * 86_400_000)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [range, searchParams])
  const filters = {
    device_id: selectedSite ? undefined : effectiveDevice || undefined,
    site_id: selectedSite || undefined,
    ...dates,
  }
  const usage = useQuery({
    queryKey: ['usage', filters, range],
    queryFn: () => api.usage({ ...filters, bucket: ranges[range].bucket }),
    enabled: Boolean(effectiveDevice || selectedSite),
  })
  const daily = useQuery({
    queryKey: ['daily', filters],
    queryFn: () => api.daily(filters),
    enabled: Boolean(effectiveDevice || selectedSite),
  })
  const heatmap = useQuery({
    queryKey: ['heatmap', filters],
    queryFn: () => api.heatmap(filters),
    enabled: Boolean(effectiveDevice || selectedSite),
  })
  const anomalies = useQuery({
    queryKey: ['anomalies', effectiveDevice, selectedSite],
    queryFn: () =>
      api.anomalies({
        device: selectedSite ? undefined : effectiveDevice,
        site: selectedSite || undefined,
      }),
    enabled: Boolean(effectiveDevice || selectedSite),
  })

  if (summary.isLoading || devices.isLoading || sites.isLoading)
    return <LoadingState label="Loading dashboard…" />
  if (summary.isError || devices.isError || sites.isError || !summary.data) return <ErrorState />
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Water usage overview</Typography>
        <Typography color="text.secondary" mt={0.5}>
          Explore fictional smart-meter data from ingestion through anomaly detection.
        </Typography>
      </Box>
      <SummaryCards summary={summary.data} />
      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            justifyContent="space-between"
            gap={2}
            mb={2}
          >
            <Box>
              <Typography variant="h6">Water flow</Typography>
              <Typography variant="body2" color="text.secondary">
                Average flow rate with detected anomaly windows
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Site</InputLabel>
                <Select
                  label="Site"
                  value={selectedSite}
                  onChange={(event) => {
                    const site = Number(event.target.value) || ''
                    setSelectedSite(site)
                    if (site) setSelectedDevice('')
                    leaveLinkedWindow(site ? '' : effectiveDevice)
                  }}
                >
                  <MenuItem value="">All / choose device</MenuItem>
                  {sites.data?.results.map((site) => (
                    <MenuItem value={site.id} key={site.id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }} disabled={Boolean(selectedSite)}>
                <InputLabel>Device</InputLabel>
                <Select
                  label="Device"
                  value={effectiveDevice}
                  onChange={(event) => {
                    setSelectedDevice(event.target.value)
                    leaveLinkedWindow(event.target.value)
                  }}
                >
                  {devices.data?.results.map((device) => (
                    <MenuItem value={device.serial_number} key={device.id}>
                      {device.name} · {device.serial_number}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={hasLinkedWindow ? null : range}
                onChange={(_, value: Range | null) => {
                  if (!value) return
                  setRange(value)
                  leaveLinkedWindow(selectedSite ? '' : effectiveDevice)
                }}
                aria-label="Chart time range"
              >
                {(Object.keys(ranges) as Range[]).map((value) => (
                  <ToggleButton key={value} value={value}>
                    {value}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          </Stack>
          {usage.isLoading || anomalies.isLoading ? (
            <LoadingState />
          ) : usage.isError || anomalies.isError ? (
            <ErrorState />
          ) : (
            <FlowChart
              points={usage.data?.points ?? []}
              anomalies={anomalies.data?.results ?? []}
            />
          )}
        </CardContent>
      </Card>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, .85fr) minmax(0, 1.15fr)' },
          gap: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6">Daily consumption</Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Volume change by day
            </Typography>
            {daily.isLoading ? (
              <LoadingState />
            ) : daily.isError ? (
              <ErrorState />
            ) : (
              <DailyConsumptionChart points={daily.data?.points ?? []} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6">Usage pattern</Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Average flow by weekday and hour
            </Typography>
            {heatmap.isLoading ? (
              <LoadingState />
            ) : heatmap.isError ? (
              <ErrorState />
            ) : (
              <UsageHeatmap points={heatmap.data?.points ?? []} />
            )}
          </CardContent>
        </Card>
      </Box>
    </Stack>
  )
}
