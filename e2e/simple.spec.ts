import { test, expect } from '@playwright/test';

test.describe('Simple Smoke Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Simple verification - using role for more precise targeting
    const heading = page.getByRole('heading', { level: 1, name: 'AI Agent Stats Dashboard' }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should respond to API request', async ({ request }) => {
    const response = await request.get('/api/data');
    expect(response.status()).toBe(200);
  });
});
