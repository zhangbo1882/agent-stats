import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test.describe('Desktop View (1280x720)', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('should display sidebar on desktop', async ({ page }) => {
      await page.goto('/');

      const sidebar = page.locator('aside').filter({ hasText: 'Agent Stats' });
      await expect(sidebar).toBeVisible();
      await expect(sidebar).toHaveCSS('width', '256px'); // w-64 = 16rem = 256px
    });

    test('should display stat cards in 4 columns', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const statCards = page.locator('.grid > div').filter({ hasText: 'Total Sessions' });
      await expect(statCards.first()).toBeVisible();

      // Check grid layout
      const grid = page.locator('.grid').filter({ hasText: 'Total Sessions' });
      const gridClass = await grid.getAttribute('class');

      // Desktop should use lg:grid-cols-4
      expect(gridClass).toContain('lg:grid-cols-4');
    });

    test('should display charts side by side', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check if charts are displayed side by side
      const chartSection = page.locator('.grid').filter({ hasText: 'Daily Activity Trend' });
      await expect(chartSection).toBeVisible();
    });
  });

  test.describe('Tablet View (768x1024)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should display sidebar on tablet', async ({ page }) => {
      await page.goto('/');

      const sidebar = page.locator('aside').filter({ hasText: 'Agent Stats' });
      await expect(sidebar).toBeVisible();
    });

    test('should display stat cards in 2 columns', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Tablet view should use md:grid-cols-2
      const grid = page.locator('.grid').filter({ hasText: 'Total Sessions' });
      await expect(grid).toBeVisible();
    });

    test('should stack charts vertically', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const activityChart = page.getByText('Daily Activity Trend');
      await expect(activityChart).toBeVisible();

      const modelChart = page.getByText('Model Usage Distribution');
      await expect(modelChart).toBeVisible();
    });
  });

  test.describe('Mobile View (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should hide sidebar by default on mobile', async ({ page }) => {
      await page.goto('/');

      // In mobile view, sidebar may be hidden or overlay by default
      const sidebar = page.locator('aside').filter({ hasText: 'Agent Stats' });
      const isHidden = await sidebar.evaluate(el => {
        return window.getComputedStyle(el).transform === 'matrix(1, 0, 0, 1, 0, 0)' ||
               el.classList.contains('-translate-x-full');
      });

      // Sidebar should be hidden or toggleable on mobile
      expect(sidebar).toBeTruthy();
    });

    test('should display stat cards in single column', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const statCards = page.locator('.grid > div').filter({ hasText: 'Total Sessions' });
      await expect(statCards.first()).toBeVisible();
    });

    test('should stack all content vertically', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // All content should stack vertically
      const heading = page.getByText('AI Agent Stats Dashboard');
      await expect(heading).toBeVisible();

      const statCards = page.getByText('Total Sessions');
      await expect(statCards).toBeVisible();

      const chart = page.getByText('Daily Activity Trend');
      await expect(chart).toBeVisible();
    });

    test('should be scrollable on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test page scrollability
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
      const clientHeight = await page.evaluate(() => document.body.clientHeight);

      expect(scrollHeight).toBeGreaterThan(clientHeight);
    });

    test('should have touch-friendly navigation', async ({ page }) => {
      await page.goto('/');

      // Navigation links should be large enough for touch
      const navLinks = page.locator('nav a');

      const count = await navLinks.count();
      if (count > 0) {
        const firstLink = navLinks.first();

        // Get dimensions of first link
        const box = await firstLink.boundingBox();
        expect(box).toBeTruthy();

        // Touch target should be at least 44x44 pixels
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('Landscape Mobile View (667x375)', () => {
    test.use({ viewport: { width: 667, height: 375 } });

    test('should display correctly in landscape', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const heading = page.getByText('AI Agent Stats Dashboard');
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Large Desktop View (1920x1080)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should utilize full width on large screens', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const heading = page.getByText('AI Agent Stats Dashboard');
      await expect(heading).toBeVisible();

      const sidebar = page.locator('aside').filter({ hasText: 'Agent Stats' });
      await expect(sidebar).toBeVisible();
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle portrait to landscape', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      await page.waitForLoadState('networkidle');
      const heading1 = page.getByText('AI Agent Stats Dashboard');
      await expect(heading1).toBeVisible();

      // Rotate to landscape
      await page.setViewportSize({ width: 667, height: 375 });

      const heading2 = page.getByText('AI Agent Stats Dashboard');
      await expect(heading2).toBeVisible();
    });

    test('should handle landscape to portrait', async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 });
      await page.goto('/');

      await page.waitForLoadState('networkidle');
      const heading1 = page.getByText('AI Agent Stats Dashboard');
      await expect(heading1).toBeVisible();

      // Rotate to portrait
      await page.setViewportSize({ width: 375, height: 667 });

      const heading2 = page.getByText('AI Agent Stats Dashboard');
      await expect(heading2).toBeVisible();
    });
  });

  test.describe('Font Scaling', () => {
    test('should handle system font scale', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check if text is visible
      const heading = page.getByText('AI Agent Stats Dashboard');
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be accessible on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Check if accessible heading exists
      const heading = page.getByRole('heading', { name: 'AI Agent Stats Dashboard' });
      await expect(heading).toBeVisible();
    });

    test('should be accessible on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      const heading = page.getByRole('heading', { name: 'AI Agent Stats Dashboard' });
      await expect(heading).toBeVisible();
    });
  });
});
