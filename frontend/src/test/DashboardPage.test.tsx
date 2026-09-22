import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from '../pages/DashboardPage'
import { mockApi } from './mockApi'
import { renderApp } from './render'

describe('DashboardPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders summary and analytics charts', async () => {
    mockApi()
    renderApp(<DashboardPage />)
    expect(screen.getByText('Loading dashboard…')).toBeInTheDocument()
    expect(await screen.findByText('1,234 L')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByTestId('echarts')).toHaveLength(3))
  })

  it('changes the requested aggregation when range changes', async () => {
    const fetchMock = mockApi()
    renderApp(<DashboardPage />)
    await screen.findByText('1,234 L')
    await userEvent.click(screen.getByRole('button', { name: '7d' }))
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes('bucket=1h'))).toBe(true),
    )
  })

  it('renders an error state when the API fails', async () => {
    mockApi({ failSummary: true })
    renderApp(<DashboardPage />)
    expect(await screen.findByText(/data could not be loaded/i)).toBeInTheDocument()
  })
})
