import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0369a1', dark: '#075985', light: '#38bdf8' },
    secondary: { main: '#0f766e' },
    background: { default: '#f4f8fa', paper: '#ffffff' },
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.025em' },
    h6: { fontWeight: 650 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)' },
      },
    },
  },
})
