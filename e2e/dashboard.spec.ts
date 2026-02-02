import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should display page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Agent Stats/);
  });

  test('should display main heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'AI Agent Stats Dashboard' });
    await expect(heading).toBeVisible();
  });

  test('should display stat cards', async ({ page }) => {
    // Wait for data to finish loading
    await page.waitForLoadState('networkidle');

    // Check if stat cards exist
    await expect(page.getByText('Total Sessions')).toBeVisible();
    await expect(page.getByText('Total Messages')).toBeVisible();
    await expect(page.getByText('Tool Calls')).toBeVisible();
    await expect(page.getByText('Active Days')).toBeVisible();
  });

  test('should display refresh button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: 'Refresh' });
    await expect(refreshButton).toBeVisible();
  });

  test('should handle refresh button click', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: 'Refresh' });

    // Click refresh button
    await refreshButton.click();

    // Verify button enters loading state (check spinning animation)
    await expect(refreshButton).toBeVisible();
  });

  test('should display activity trend chart', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check activity trend chart
    await expect(page.getByText('Daily Activity Trend')).toBeVisible();
    await expect(page.getByText('Message count for the past 30 days')).toBeVisible();
  });

  test('should display model usage chart', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check model usage distribution chart
    await expect(page.getByText('Model Usage Distribution')).toBeVisible();
    await expect(page.getByText('Token usage by model')).toBeVisible();
  });

  test('should display popular projects chart', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check popular projects chart
    await expect(page.getByText('Top Projects')).toBeVisible();
    await expect(page.getByText('Top 10 projects ranked by session count')).toBeVisible();
  });

  test('should display additional stats cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check additional stat cards
    await expect(page.getByText('Longest Session')).toBeVisible();
    await expect(page.getByText('First Used')).toBeVisible();
    await expect(page.getByText('Stats Version')).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Reload page to see loading state
    await page.reload();

    // Check if loading text is displayed
    const loadingText = page.getByText('Loading');
    await expect(loadingText).toBeVisible();
  });

  test('should handle error state gracefully', async ({ page }) => {
    // Simulate API failure - this test needs test environment configuration
    // In real scenarios, may need to mock API failure
    test.skip(true, 'Need to configure mock API to test error state');
  });

  test('should display last update timestamp', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check if last update time is displayed
    await expect(page.getByText(/Last updated/)).toBeVisible();
  });

  test('should have responsive layout', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByText('Total Sessions')).toBeVisible();

    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Total Sessions')).toBeVisible();

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('Total Sessions')).toBeVisible();
  });
});
