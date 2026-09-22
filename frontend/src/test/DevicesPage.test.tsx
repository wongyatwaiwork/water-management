import { screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { DevicesPage } from '../pages/DevicesPage'
import { mockApi } from './mockApi'
import { renderApp } from './render'

afterEach(() => vi.restoreAllMocks())

it('renders device status and telemetry', async () => {
  mockApi()
  renderApp(<DevicesPage />)
  expect(await screen.findByText('Main inlet')).toBeInTheDocument()
  expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  expect(screen.getByText(/1.200 L\/min/)).toBeInTheDocument()
})

it('renders an empty fleet state', async () => {
  mockApi({ emptyDevices: true })
  renderApp(<DevicesPage />)
  expect(await screen.findByText('No devices match these filters.')).toBeInTheDocument()
})
