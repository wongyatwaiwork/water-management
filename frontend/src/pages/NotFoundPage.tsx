import { Button, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h4">Page not found</Typography>
      <Button component={Link} to="/dashboard">
        Return to dashboard
      </Button>
    </Stack>
  )
}
