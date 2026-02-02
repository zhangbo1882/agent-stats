import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display sidebar', async ({ page }) => {
    const sidebar = page.locator('aside').filter({ hasText: 'Agent Stats' });
    await expect(sidebar).toBeVisible();
  });

  test('should display all navigation links', async ({ page }) => {
    const navLinks = [
      'Dashboard',
      'Skills',
      'Plugins',
      'MCP',
      'Sessions',
      'Plans',
      'Projects',
      'Debug',
      'Settings',
    ];

    for (const link of navLinks) {
      await expect(page.getByRole('link', { name: link })).toBeVisible();
    }
  });

  test('should navigate to Skills page', async ({ page }) => {
    await page.getByRole('link', { name: 'Skills' }).click();
    await expect(page).toHaveURL(/\/skills/);
    await expect(page.getByText('Skills')).toBeVisible();
  });

  test('should navigate to Plugins page', async ({ page }) => {
    await page.getByRole('link', { name: 'Plugins' }).click();
    await expect(page).toHaveURL(/\/plugins/);
    await expect(page.getByText('Plugins')).toBeVisible();
  });

  test('should navigate to MCP page', async ({ page }) => {
    await page.getByRole('link', { name: 'MCP' }).click();
    await expect(page).toHaveURL(/\/mcp/);
    await expect(page.getByText('MCP')).toBeVisible();
  });

  test('should navigate to Sessions page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sessions' }).click();
    await expect(page).toHaveURL(/\/sessions/);
    await expect(page.getByText('Sessions')).toBeVisible();
  });

  test('should navigate to Plans page', async ({ page }) => {
    await page.getByRole('link', { name: 'Plans' }).click();
    await expect(page).toHaveURL(/\/plans/);
    await expect(page.getByText('Plans')).toBeVisible();
  });

  test('should navigate to Projects page', async ({ page }) => {
    await page.getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByText('Projects')).toBeVisible();
  });

  test('should navigate to Debug page', async ({ page }) => {
    await page.getByRole('link', { name: 'Debug' }).click();
    await expect(page).toHaveURL(/\/debug/);
    await expect(page.getByText('Debug')).toBeVisible();
  });

  test('should navigate to Settings page', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('should navigate back to home', async ({ page }) => {
    // Navigate to another page
    await page.getByRole('link', { name: 'Skills' }).click();
    await expect(page).toHaveURL(/\/skills/);

    // Click Overview to return to home page
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('AI Agent Stats Dashboard')).toBeVisible();
  });

  test('should highlight active navigation item', async ({ page }) => {
    // Home page should be highlighted
    const overviewLink = page.getByRole('link', { name: 'Dashboard' }).first();
    await expect(overviewLink).toHaveClass(/bg-primary/);

    // Click Skills
    await page.getByRole('link', { name: 'Skills' }).click();

    // Skills should be highlighted, Overview should not be highlighted
    const skillsLink = page.getByRole('link', { name: 'Skills' });
    await expect(skillsLink).toHaveClass(/bg-primary/);
  });

  test('should toggle sidebar', async ({ page }) => {
    const sidebar = page.locator('aside').filter({ hasText: 'Agent Stats' });

    // Sidebar should be initially visible
    await expect(sidebar).toBeVisible();

    // Find close button (X icon)
    const closeButton = sidebar.locator('button').filter({ hasText: '' }).first();
    await closeButton.click();

    // Sidebar should be hidden
    await expect(sidebar).not.toBeInViewport();
  });

  test('should display navigation icons', async ({ page }) => {
    // Check if navigation icons are visible
    const navLinks = page.locator('nav a');

    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    // Each navigation link should have an icon
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      await expect(link.locator('svg')).toBeVisible();
    }
  });

  test('should navigate using direct URL', async ({ page }) => {
    // Direct URL access
    await page.goto('/skills');
    await expect(page).toHaveURL(/\/skills/);

    // Direct access to another URL
    await page.goto('/plugins');
    await expect(page).toHaveURL(/\/plugins/);
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Navigate to Skills
    await page.getByRole('link', { name: 'Skills' }).click();
    await expect(page).toHaveURL(/\/skills/);

    // Navigate to Plugins
    await page.getByRole('link', { name: 'Plugins' }).click();
    await expect(page).toHaveURL(/\/plugins/);

    // Browser back
    await page.goBack();
    await expect(page).toHaveURL(/\/skills/);

    // Browser forward
    await page.goForward();
    await expect(page).toHaveURL(/\/plugins/);
  });

  test('should work with keyboard navigation', async ({ page }) => {
    // Use Tab key to navigate to first link
    await page.keyboard.press('Tab');

    // Check if any element has focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('A');
  });

  test('should maintain navigation state on refresh', async ({ page }) => {
    // Navigate to Skills
    await page.getByRole('link', { name: 'Skills' }).click();
    await expect(page).toHaveURL(/\/skills/);

    // Refresh page
    await page.reload();

    // Should still be on Skills page
    await expect(page).toHaveURL(/\/skills/);
    await expect(page.getByText('Skills')).toBeVisible();
  });
});
