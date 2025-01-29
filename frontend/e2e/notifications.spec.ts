import { test, expect } from '@playwright/test';
import { setupE2ETest, loginAsCustomer } from '../lib/e2e-utils';

test.describe('Notification Flows', () => {
  test.beforeEach(async ({ page }) => {
    await setupE2ETest();
    await loginAsCustomer(page);
  });

  test('should display notifications in the panel', async ({ page }) => {
    await page.goto('/customer/dashboard');
    
    // Check notification panel is visible
    const notificationPanel = page.getByTestId('notification-panel');
    await expect(notificationPanel).toBeVisible();
    
    // Check notification count
    const notificationCount = page.getByTestId('notification-count');
    await expect(notificationCount).toBeVisible();
    
    // Check notification items are loaded
    const notifications = page.getByTestId('notification-item');
    await expect(notifications.first()).toBeVisible();
  });

  test('should mark notifications as read', async ({ page }) => {
    await page.goto('/customer/dashboard');
    
    // Get initial unread count
    const initialCount = await page.getByTestId('notification-count').textContent();
    
    // Click "Mark as read" on first notification
    await page.getByRole('button', { name: 'Mark as read' }).first().click();
    
    // Verify count decreased
    const newCount = await page.getByTestId('notification-count').textContent();
    expect(Number(newCount)).toBeLessThan(Number(initialCount));
  });

  test('should load more notifications on scroll', async ({ page }) => {
    await page.goto('/customer/notifications');
    
    // Get initial notification count
    const initialNotifications = await page.getByTestId('notification-item').count();
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Wait for more notifications to load
    await page.waitForTimeout(1000);
    
    // Verify more notifications loaded
    const newNotifications = await page.getByTestId('notification-item').count();
    expect(newNotifications).toBeGreaterThan(initialNotifications);
  });

  test('should filter notifications by type', async ({ page }) => {
    await page.goto('/customer/notifications');
    
    // Click filter dropdown
    await page.getByRole('button', { name: 'Filter notifications' }).click();
    
    // Select "Order updates" filter
    await page.getByRole('option', { name: 'Order updates' }).click();
    
    // Verify filtered notifications
    const notifications = page.getByTestId('notification-item');
    await expect(notifications.first()).toContainText('Order');
  });

  test('should show real-time notifications', async ({ page }) => {
    await page.goto('/customer/dashboard');
    
    // Get initial notification count
    const initialCount = await page.getByTestId('notification-count').textContent();
    
    // Trigger a new notification (e.g., by creating an order in another session)
    // This would be implemented based on your application's specific logic
    
    // Verify new notification appears
    await expect(async () => {
      const newCount = await page.getByTestId('notification-count').textContent();
      expect(Number(newCount)).toBeGreaterThan(Number(initialCount));
    }).toPass();
    
    // Verify notification toast appears
    await expect(page.getByTestId('notification-toast')).toBeVisible();
  });

  test('should navigate to notification source', async ({ page }) => {
    await page.goto('/customer/notifications');
    
    // Click on an order notification
    const orderNotification = page.getByText('Order Status Updated').first();
    await orderNotification.click();
    
    // Verify navigation to order details
    await expect(page).toHaveURL(/\/orders\/[\w-]+/);
  });

  test('should handle notification preferences', async ({ page }) => {
    await page.goto('/customer/settings');
    
    // Navigate to notification preferences
    await page.getByRole('link', { name: 'Notification preferences' }).click();
    
    // Toggle email notifications
    await page.getByLabel('Email notifications').click();
    
    // Save preferences
    await page.getByRole('button', { name: 'Save preferences' }).click();
    
    // Verify success message
    await expect(page.getByText('Preferences saved')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Simulate offline state
    await page.route('**/api/notifications', route => route.abort());
    
    await page.goto('/customer/notifications');
    
    // Verify error message
    await expect(page.getByText('Failed to load notifications')).toBeVisible();
    
    // Verify retry button
    const retryButton = page.getByRole('button', { name: 'Retry' });
    await expect(retryButton).toBeVisible();
    
    // Restore connection and retry
    await page.unroute('**/api/notifications');
    await retryButton.click();
    
    // Verify notifications load
    await expect(page.getByTestId('notification-item').first()).toBeVisible();
  });
}); 