import { Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import WaterIcon from '@mui/icons-material/Water'
import SpeedIcon from '@mui/icons-material/Speed'
import SensorsIcon from '@mui/icons-material/Sensors'
import SensorsOffIcon from '@mui/icons-material/SensorsOff'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import type { Summary } from '../types/api'

const cards = (summary: Summary) => [
  {
    label: "Today's usage",
    value: `${summary.today_usage_liters.toLocaleString()} L`,
    icon: <WaterIcon />,
    color: '#0284c7',
  },
  {
    label: 'Current total flow',
    value: `${summary.current_total_flow_lpm.toFixed(1)} L/min`,
    icon: <SpeedIcon />,
    color: '#0891b2',
  },
  {
    label: 'Active devices',
    value: String(summary.active_devices),
    icon: <SensorsIcon />,
    color: '#059669',
  },
  {
    label: 'Offline / stale',
    value: String(summary.offline_or_stale_devices),
    icon: <SensorsOffIcon />,
    color: '#d97706',
  },
  {
    label: 'Open anomalies',
    value: String(summary.open_anomalies),
    icon: <WarningAmberIcon />,
    color: '#dc2626',
  },
]

export function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <Grid container spacing={2}>
      {cards(summary).map((card) => (
        <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <div>
                  <Typography variant="body2" color="text.secondary">
                    {card.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={700} mt={0.5}>
                    {card.value}
                  </Typography>
                </div>
                <Stack
                  sx={{ p: 1, borderRadius: 2, bgcolor: `${card.color}14`, color: card.color }}
                >
                  {card.icon}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
