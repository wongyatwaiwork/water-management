import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { AnomaliesPage } from '../pages/AnomaliesPage'
import { mockApi } from './mockApi'
import { renderApp } from './render'

afterEach(() => vi.restoreAllMocks())

it('renders and opens anomaly details', async () => {
  mockApi()
  renderApp(<AnomaliesPage />)
  const rowText = await screen.findByText('CONTINUOUS FLOW')
  await userEvent.click(rowText)
  expect(await screen.findByText('Continuous flow demo rule.')).toBeInTheDocument()
})
