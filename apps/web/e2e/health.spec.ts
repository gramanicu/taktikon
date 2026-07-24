import { expect, test } from '@playwright/test'

// Mocks the API so the E2E is hermetic (no live backend needed).
test('renders API health status', async ({ page }) => {
  await page.route('**/health', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok' }),
    }),
  )

  await page.goto('/')
  await expect(page.getByText('API status: ok')).toBeVisible()
})
