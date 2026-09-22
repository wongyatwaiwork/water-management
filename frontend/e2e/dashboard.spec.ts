import { expect, test } from '@playwright/test'

test('reviewer explores usage and opens a detected anomaly', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Water usage overview' })).toBeVisible()
  await page.getByRole('combobox').nth(1).click()
  await page.getByRole('option', { name: /Main inlet · WM-001/ }).click()
  await page.getByRole('button', { name: '7d' }).click()
  await expect(page.getByText('Average flow rate with detected anomaly windows')).toBeVisible()

  await page.getByRole('link', { name: 'Anomalies' }).click()
  await expect(page.getByText('CONTINUOUS FLOW').first()).toBeVisible()
  await page.getByRole('button', { name: 'Chart' }).first().click()
  await expect(page).toHaveURL(/dashboard\?device=WM-001/)
  await expect(page.getByRole('heading', { name: 'Water usage overview' })).toBeVisible()
})
