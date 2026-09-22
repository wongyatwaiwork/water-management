import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
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
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { EmptyState, ErrorState, LoadingState } from '../components/QueryState'
import type { Anomaly, AnomalySeverity } from '../types/api'

const severityColor: Record<AnomalySeverity, 'default' | 'warning' | 'error'> = {
  LOW: 'default',
  MEDIUM: 'warning',
  HIGH: 'error',
}

export function AnomaliesPage() {
  const [severity, setSeverity] = useState<AnomalySeverity | ''>('')
  const [type, setType] = useState('')
  const [selected, setSelected] = useState<Anomaly | null>(null)
  const navigate = useNavigate()
  const anomalies = useQuery({
    queryKey: ['anomalies', severity, type],
    queryFn: () => api.anomalies({ severity: severity || undefined, type: type || undefined }),
  })
  const inspect = (anomaly: Anomaly) => {
    const start = new Date(new Date(anomaly.start_time).getTime() - 60 * 60 * 1000).toISOString()
    const end = new Date(
      new Date(anomaly.end_time ?? anomaly.start_time).getTime() + 60 * 60 * 1000,
    ).toISOString()
    navigate(`/dashboard?device=${anomaly.device_serial_number}&from=${start}&to=${end}`)
  }
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Detected anomalies</Typography>
        <Typography color="text.secondary" mt={0.5}>
          Transparent demonstration rules flag suspicious flow and telemetry gaps.
        </Typography>
      </Box>
      <Alert severity="info">
        These flags are decision-support examples, not production-grade leak detection.
      </Alert>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Severity</InputLabel>
          <Select
            label="Severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as AnomalySeverity | '')}
          >
            <MenuItem value="">All severities</MenuItem>
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 210 }}>
          <InputLabel>Type</InputLabel>
          <Select label="Type" value={type} onChange={(event) => setType(event.target.value)}>
            <MenuItem value="">All types</MenuItem>
            <MenuItem value="CONTINUOUS_FLOW">Continuous flow</MenuItem>
            <MenuItem value="READING_GAP">Reading gap</MenuItem>
            <MenuItem value="HIGH_FLOW">High flow</MenuItem>
            <MenuItem value="INVALID_READING">Invalid reading</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      {anomalies.isLoading ? (
        <LoadingState />
      ) : anomalies.isError ? (
        <ErrorState />
      ) : !anomalies.data?.results.length ? (
        <Card>
          <EmptyState>No anomalies match these filters.</EmptyState>
        </Card>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Device</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {anomalies.data.results.map((anomaly) => (
                <TableRow
                  key={anomaly.id}
                  hover
                  onClick={() => setSelected(anomaly)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography fontWeight={600}>{anomaly.device_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {anomaly.device_serial_number} · {anomaly.site_name}
                    </Typography>
                  </TableCell>
                  <TableCell>{anomaly.anomaly_type.replaceAll('_', ' ')}</TableCell>
                  <TableCell>{new Date(anomaly.start_time).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={anomaly.severity}
                      color={severityColor[anomaly.severity]}
                    />
                  </TableCell>
                  <TableCell>{anomaly.status}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      endIcon={<OpenInNewIcon />}
                      onClick={(event) => {
                        event.stopPropagation()
                        inspect(anomaly)
                      }}
                    >
                      Chart
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle>{selected.anomaly_type.replaceAll('_', ' ')}</DialogTitle>
            <DialogContent>
              <Stack spacing={1.5}>
                <Typography>
                  <strong>Device:</strong> {selected.device_name} ({selected.device_serial_number})
                </Typography>
                <Typography>
                  <strong>Window:</strong> {new Date(selected.start_time).toLocaleString()} –{' '}
                  {selected.end_time ? new Date(selected.end_time).toLocaleString() : 'ongoing'}
                </Typography>
                <Typography>{selected.description}</Typography>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelected(null)}>Close</Button>
              <Button variant="contained" onClick={() => inspect(selected)}>
                Inspect chart
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Stack>
  )
}
