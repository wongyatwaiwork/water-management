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

  it('leaves an anomaly window when a standard range is selected', async () => {
    const fetchMock = mockApi()
    const view = renderApp(
      <DashboardPage />,
      '/dashboard?device=WM-001&from=2026-09-23T01%3A42%3A00.000Z&to=2026-09-23T05%3A42%3A00.000Z',
    )
    await view.findByText('1,234 L')

    await userEvent.click(view.getByRole('button', { name: '24h' }))

    await waitFor(() => {
      const usageUrls = fetchMock.mock.calls
        .map(([url]) => String(url))
        .filter((url) => url.includes('/analytics/usage/'))
      expect(usageUrls.at(-1)).not.toContain('2026-09-23T01%3A42%3A00.000Z')
      expect(usageUrls.at(-1)).toContain('bucket=5m')
    })
  })

  it('updates the URL-backed device and leaves an anomaly window when the device changes', async () => {
    const fetchMock = mockApi({ multipleDevices: true })
    const view = renderApp(
      <DashboardPage />,
      '/dashboard?device=WM-001&from=2026-09-23T01%3A42%3A00.000Z&to=2026-09-23T05%3A42%3A00.000Z',
    )
    await view.findByText('1,234 L')

    await userEvent.click(view.getAllByRole('combobox')[1])
    await userEvent.click(await screen.findByRole('option', { name: 'Garden supply · WM-004' }))

    await waitFor(() => {
      const usageUrls = fetchMock.mock.calls
        .map(([url]) => String(url))
        .filter((url) => url.includes('/analytics/usage/'))
      expect(usageUrls.at(-1)).toContain('device_id=WM-004')
      expect(usageUrls.at(-1)).not.toContain('2026-09-23T01%3A42%3A00.000Z')
    })
  })

  it('renders an error state when the API fails', async () => {
    mockApi({ failSummary: true })
    renderApp(<DashboardPage />)
    expect(await screen.findByText(/data could not be loaded/i)).toBeInTheDocument()
  })
})
