import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { api } from '../api/client'
import { ErrorState, LoadingState, EmptyState } from '../components/QueryState'
import { StatusChip } from '../components/StatusChip'
import type { DeviceStatus } from '../types/api'

const statusValues: DeviceStatus[] = ['ACTIVE', 'OFFLINE', 'MAINTENANCE', 'DECOMMISSIONED']

export function DevicesPage() {
  const [site, setSite] = useState<number | ''>('')
  const [status, setStatus] = useState<DeviceStatus | ''>('')
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('sm'))
  const sites = useQuery({ queryKey: ['sites'], queryFn: api.sites })
  const devices = useQuery({
    queryKey: ['devices', site, status],
    queryFn: () => api.devices({ site: site || undefined, status: status || undefined }),
  })
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Device fleet</Typography>
        <Typography color="text.secondary" mt={0.5}>
          Latest health and telemetry across the fictional meter estate.
        </Typography>
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Site</InputLabel>
          <Select
            value={site}
            label="Site"
            onChange={(event) => setSite(Number(event.target.value) || '')}
          >
            <MenuItem value="">All sites</MenuItem>
            {sites.data?.results.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(event) => setStatus(event.target.value as DeviceStatus | '')}
          >
            <MenuItem value="">All statuses</MenuItem>
            {statusValues.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      {devices.isLoading ? (
        <LoadingState />
      ) : devices.isError ? (
        <ErrorState />
      ) : !devices.data?.results.length ? (
        <Card>
          <EmptyState>No devices match these filters.</EmptyState>
        </Card>
      ) : compact ? (
        <Stack spacing={1.5}>
          {devices.data.results.map((device) => {
            return (
              <Card key={device.id} sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between">
                  <div>
                    <Typography fontWeight={700}>{device.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {device.serial_number} · {device.site_name}
                    </Typography>
                  </div>
                  <StatusChip status={device.status} stale={device.is_stale} />
                </Stack>
                <Stack direction="row" justifyContent="space-between" mt={2}>
                  <Typography variant="body2">
                    Flow: {device.latest_flow_rate_lpm ?? '—'} L/min
                  </Typography>
                  <Typography variant="body2">
                    Battery: {device.latest_battery_voltage ?? '—'} V
                  </Typography>
                </Stack>
              </Card>
            )
          })}
        </Stack>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Device</TableCell>
                <TableCell>Site</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last seen</TableCell>
                <TableCell align="right">Latest flow</TableCell>
                <TableCell align="right">Battery</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.data.results.map((device) => {
                return (
                  <TableRow key={device.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{device.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {device.serial_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{device.site_name}</TableCell>
                    <TableCell>
                      <StatusChip status={device.status} stale={device.is_stale} />
                    </TableCell>
                    <TableCell>
                      {device.last_seen_at
                        ? new Date(device.last_seen_at).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell align="right">{device.latest_flow_rate_lpm ?? '—'} L/min</TableCell>
                    <TableCell align="right">{device.latest_battery_voltage ?? '—'} V</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  )
}
