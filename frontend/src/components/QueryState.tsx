import { Alert, Box, CircularProgress, Typography } from '@mui/material'
import type { ReactNode } from 'react'

export function LoadingState({ label = 'Loading data…' }: { label?: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minHeight: 180,
      }}
    >
      <CircularProgress size={28} />
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  )
}

export function ErrorState({ message = 'The data could not be loaded.' }: { message?: string }) {
  return (
    <Alert severity="error">{message} Check that the backend is reachable, then try again.</Alert>
  )
}

export function EmptyState({
  children = 'No data is available for this selection.',
}: {
  children?: ReactNode
}) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 180 }}>
      <Typography color="text.secondary">{children}</Typography>
    </Box>
  )
}
