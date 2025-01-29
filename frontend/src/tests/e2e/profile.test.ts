import { test, expect } from '@playwright/test';
import { setupE2ETest, loginAsSupplier } from '../lib/e2e-utils';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupE2ETest();
    await loginAsSupplier(page);
    await page.goto('/profile');
  });

  test('renders correctly on desktop (1280x720)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Check layout structure
    await expect(page.locator('.max-w-7xl')).toBeVisible();
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();
    
    // Verify grid layout
    const form = page.locator('form');
    await expect(form.locator('.grid-cols-2')).toBeVisible();
    
    // Check button positioning
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveCSS('width', /auto|fit-content/);
  });

  test('adapts layout for tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check responsive padding
    const container = page.locator('.max-w-7xl');
    await expect(container).toHaveCSS('padding-left', '24px');
    await expect(container).toHaveCSS('padding-right', '24px');
    
    // Verify form layout adjustments
    const form = page.locator('form');
    await expect(form.locator('.grid-cols-2')).toBeVisible();
    
    // Check button width
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveCSS('width', /auto|fit-content/);
  });

  test('adapts layout for mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check responsive padding
    const container = page.locator('.max-w-7xl');
    await expect(container).toHaveCSS('padding-left', '16px');
    await expect(container).toHaveCSS('padding-right', '16px');
    
    // Verify single column layout
    const form = page.locator('form');
    await expect(form.locator('.grid-cols-1')).toBeVisible();
    
    // Check full-width button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveCSS('width', '100%');
    
    // Verify text input visibility
    const inputs = page.locator('input[type="text"]');
    await expect(inputs).toBeVisible();
    
    // Check that labels are visible and properly positioned
    const labels = page.locator('label');
    await expect(labels).toBeVisible();
  });

  test('handles form submission on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Fill out form
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success message is visible and properly positioned
    const successMessage = page.locator('.text-green-600');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toHaveCSS('margin-top', '16px');
  });

  test('displays loading skeleton responsively', async ({ page }) => {
    // Force loading state
    await page.route('**/api/v1/users/profile', route => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    // Check desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('.animate-pulse')).toBeVisible();
    
    // Check tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.animate-pulse')).toBeVisible();
    
    // Check mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.animate-pulse')).toBeVisible();
  });
}); 