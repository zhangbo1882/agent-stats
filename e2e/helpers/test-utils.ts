import { Page, expect } from '@playwright/test';

/**
 * Test helper utility functions
 */

/**
 * Wait for data to finish loading (check loading state)
 */
export async function waitForDataLoaded(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('body', { state: 'visible' });
}

/**
 * Navigate to specified page and wait for loading to complete
 */
export async function navigateToPage(page: Page, path: string) {
  await page.goto(path);
  await waitForDataLoaded(page);
}

/**
 * Get stats data
 */
export async function getStats(page: Page) {
  const response = await page.request.get('/api/data');
  return await response.json();
}

/**
 * Check if page displays loading state
 */
export async function isLoading(page: Page): Promise<boolean> {
  const loadingText = page.getByText('Loading');
  return await loadingText.isVisible().catch(() => false);
}

/**
 * Check if page displays error state
 */
export async function hasError(page: Page): Promise<boolean> {
  const errorCard = page.locator('.border-destructive');
  return await errorCard.isVisible().catch(() => false);
}

/**
 * Click refresh button
 */
export async function refreshData(page: Page) {
  const refreshButton = page.getByRole('button', { name: 'Refresh' });
  await refreshButton.click();
}

/**
 * Verify sidebar visibility
 */
export async function isSidebarVisible(page: Page): Promise<boolean> {
  const sidebar = page.locator('aside').filter({ hasText: 'Agent Stats' });
  return await sidebar.isVisible().catch(() => false);
}

/**
 * Toggle sidebar
 */
export async function toggleSidebar(page: Page) {
  const sidebar = page.locator('aside').filter({ hasText: 'Agent Stats' });
  const toggleButton = sidebar.locator('button').first();
  await toggleButton.click();
}

/**
 * Get all navigation links
 */
export async function getNavLinks(page: Page) {
  return await page.locator('nav a').all();
}

/**
 * Verify current page title
 */
export async function verifyPageTitle(page: Page, title: string) {
  await expect(page).toHaveTitle(new RegExp(title));
}

/**
 * Check if element is visible in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  return await element.isVisible().catch(() => false);
}
