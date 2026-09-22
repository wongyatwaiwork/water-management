import { Chip } from '@mui/material'
import type { DeviceStatus } from '../types/api'

const colors: Record<DeviceStatus, 'success' | 'warning' | 'error' | 'default'> = {
  ACTIVE: 'success',
  OFFLINE: 'error',
  MAINTENANCE: 'warning',
  DECOMMISSIONED: 'default',
}

export function StatusChip({ status, stale = false }: { status: DeviceStatus; stale?: boolean }) {
  return (
    <Chip
      size="small"
      color={stale ? 'warning' : colors[status]}
      label={stale ? 'STALE' : status}
      variant={status === 'DECOMMISSIONED' ? 'outlined' : 'filled'}
    />
  )
}
