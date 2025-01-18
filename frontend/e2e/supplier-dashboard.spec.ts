import { test, expect } from '@playwright/test';
import { setupE2ETest, loginAsSupplier } from './utils';

test.describe('Supplier Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupE2ETest();
    await loginAsSupplier(page);
    await page.goto('/supplier/dashboard');
  });

  test('displays all dashboard components', async ({ page }) => {
    // Check all main components are visible
    await expect(page.getByTestId('order-management')).toBeVisible();
    await expect(page.getByTestId('sales-analytics')).toBeVisible();
    await expect(page.getByTestId('customer-insights')).toBeVisible();
    await expect(page.getByTestId('inventory-overview')).toBeVisible();
  });

  test('order management functionality', async ({ page }) => {
    // Test order filtering
    await page.selectOption('[data-testid="order-status-filter"]', 'processing');
    await expect(page.getByTestId('order-list')).toContainText('Processing');
    
    // Test pagination
    const nextButton = page.getByRole('button', { name: 'Next page' });
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await expect(page.getByTestId('current-page')).toContainText('2');
    }

    // Test order details
    await page.getByTestId('order-row').first().click();
    await expect(page.getByTestId('order-details')).toBeVisible();
  });

  test('sales analytics interactions', async ({ page }) => {
    // Test timeframe selection
    await page.selectOption('[data-testid="timeframe-select"]', 'week');
    await expect(page.getByTestId('revenue-chart')).toBeVisible();

    // Verify metrics update
    await expect(page.getByTestId('total-revenue')).not.toContainText('Loading');
    await expect(page.getByTestId('total-orders')).not.toContainText('Loading');
    
    // Test chart interactions
    const chart = page.getByTestId('revenue-chart');
    await chart.hover();
    await expect(page.getByTestId('chart-tooltip')).toBeVisible();
  });

  test('customer insights navigation', async ({ page }) => {
    // Test view switching
    await page.getByRole('button', { name: 'Top Customers' }).click();
    await expect(page.getByTestId('top-customers-list')).toBeVisible();

    await page.getByRole('button', { name: 'Overview' }).click();
    await expect(page.getByTestId('customer-segments')).toBeVisible();

    // Test customer details
    await page.getByRole('button', { name: 'Top Customers' }).click();
    await page.getByTestId('customer-row').first().click();
    await expect(page.getByTestId('customer-details')).toBeVisible();
  });

  test('inventory management features', async ({ page }) => {
    // Test stock filtering
    await page.getByRole('button', { name: 'Low Stock' }).click();
    await expect(page.getByTestId('product-list')).toContainText('Low Stock');

    // Test search functionality
    await page.getByPlaceholder('Search products').fill('Test Product');
    await expect(page.getByTestId('product-list')).toContainText('Test Product');

    // Test reorder functionality
    await page.getByTestId('reorder-button').first().click();
    await expect(page.getByTestId('reorder-modal')).toBeVisible();
  });

  test('responsive layout', async ({ page }) => {
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.getByTestId('mobile-menu')).toBeVisible();

    // Open mobile menu
    await page.getByTestId('mobile-menu-button').click();
    await expect(page.getByTestId('mobile-nav')).toBeVisible();

    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByTestId('tablet-layout')).toBeVisible();
  });

  test('data refresh functionality', async ({ page }) => {
    // Test manual refresh
    await page.getByTestId('refresh-button').click();
    await expect(page.getByTestId('loading-indicator')).toBeVisible();
    await expect(page.getByTestId('loading-indicator')).toBeHidden();

    // Test auto-refresh
    await page.getByTestId('auto-refresh-toggle').click();
    // Wait for auto-refresh interval
    await page.waitForTimeout(60000);
    await expect(page.getByTestId('last-updated')).toContainText('less than a minute ago');
  });

  test('error handling', async ({ page, context }) => {
    // Test offline behavior
    await context.setOffline(true);
    await page.getByTestId('refresh-button').click();
    await expect(page.getByTestId('error-message')).toContainText('network');
    await context.setOffline(false);

    // Test API error handling
    await page.route('**/api/supplier/**', route => 
      route.fulfill({ status: 500 })
    );
    await page.getByTestId('refresh-button').click();
    await expect(page.getByTestId('error-message')).toBeVisible();
  });

  test('data persistence', async ({ page, context }) => {
    // Set some filters
    await page.selectOption('[data-testid="order-status-filter"]', 'processing');
    await page.selectOption('[data-testid="timeframe-select"]', 'week');

    // Refresh page
    await page.reload();

    // Verify filters persist
    await expect(page.getByTestId('order-status-filter')).toHaveValue('processing');
    await expect(page.getByTestId('timeframe-select')).toHaveValue('week');
  });
}); 