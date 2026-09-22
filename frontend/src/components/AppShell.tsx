import { useState } from 'react'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SensorsIcon from '@mui/icons-material/Sensors'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import { NavLink, Outlet } from 'react-router-dom'

const drawerWidth = 248
const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Device fleet', to: '/devices', icon: <SensorsIcon /> },
  { label: 'Anomalies', to: '/anomalies', icon: <WarningAmberIcon /> },
]

export function AppShell() {
  const theme = useTheme()
  const desktop = useMediaQuery(theme.breakpoints.up('md'))
  const [open, setOpen] = useState(false)
  const drawer = (
    <Box sx={{ height: '100%', background: '#082f49', color: '#e0f2fe' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <WaterDropIcon color="info" />
        <Typography variant="h6">AquaScope</Typography>
      </Toolbar>
      <List sx={{ px: 1.5 }}>
        {navigation.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={() => setOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: 'inherit',
              '&.active': { background: 'rgba(56,189,248,.18)', color: '#7dd3fc' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ p: 2.5, position: 'absolute', bottom: 0 }}>
        <Typography variant="caption" color="#94a3b8">
          Fictional demo telemetry
        </Typography>
      </Box>
    </Box>
  )
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          ml: { md: `${drawerWidth}px` },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          background: 'rgba(255,255,255,.94)',
          color: 'text.primary',
          boxShadow: '0 1px 0 #e2e8f0',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar>
          <IconButton
            onClick={() => setOpen(true)}
            sx={{ mr: 1, display: { md: 'none' } }}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </IconButton>
          <Typography fontWeight={600}>Water IoT Monitoring</Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={desktop ? 'permanent' : 'temporary'}
          open={desktop || open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: drawerWidth, border: 0 } }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          p: { xs: 2, sm: 3 },
          pt: { xs: 10, sm: 11 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
