import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { chromium, Browser, Page } from 'playwright';

describe('E2E User Flows', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });

  afterEach(async () => {
    await page.close();
  });

  describe('User Authentication', () => {
    it('should complete the signup process', async () => {
      await page.click('[data-testid="signup-button"]');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'Test123!@#');
      await page.click('[data-testid="submit-signup"]');

      const welcomeMessage = await page.textContent('[data-testid="welcome-message"]');
      expect(welcomeMessage).toContain('Welcome');
    });

    it('should handle login and logout', async () => {
      // Login
      await page.click('[data-testid="login-button"]');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'Test123!@#');
      await page.click('[data-testid="submit-login"]');

      // Verify login
      const userMenu = await page.textContent('[data-testid="user-menu"]');
      expect(userMenu).toBeDefined();

      // Logout
      await page.click('[data-testid="logout-button"]');
      const loginButton = await page.textContent('[data-testid="login-button"]');
      expect(loginButton).toBeDefined();
    });
  });

  describe('Order Management Flow', () => {
    it('should complete an order from browse to checkout', async () => {
      // Login first
      await page.click('[data-testid="login-button"]');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'Test123!@#');
      await page.click('[data-testid="submit-login"]');

      // Browse products
      await page.click('[data-testid="products-link"]');
      await page.waitForSelector('[data-testid="product-card"]');

      // Add to cart
      await page.click('[data-testid="add-to-cart-1"]');
      await page.click('[data-testid="cart-icon"]');

      // Verify cart
      const cartItem = await page.textContent('[data-testid="cart-item-1"]');
      expect(cartItem).toBeDefined();

      // Checkout
      await page.click('[data-testid="checkout-button"]');
      await page.fill('[data-testid="shipping-address"]', '123 Test St');
      await page.fill('[data-testid="shipping-city"]', 'Test City');
      await page.fill('[data-testid="shipping-zip"]', '12345');
      await page.click('[data-testid="place-order"]');

      // Verify order confirmation
      const confirmation = await page.textContent('[data-testid="order-confirmation"]');
      expect(confirmation).toContain('Order Placed Successfully');
    });
  });

  describe('Analytics Flow', () => {
    it('should track user interactions', async () => {
      // Login as admin
      await page.click('[data-testid="login-button"]');
      await page.fill('[data-testid="email-input"]', 'admin@example.com');
      await page.fill('[data-testid="password-input"]', 'Admin123!@#');
      await page.click('[data-testid="submit-login"]');

      // Navigate to analytics
      await page.click('[data-testid="analytics-link"]');
      
      // Generate report
      await page.click('[data-testid="generate-report"]');
      await page.waitForSelector('[data-testid="report-content"]');

      // Verify report content
      const reportContent = await page.textContent('[data-testid="report-content"]');
      expect(reportContent).toContain('User Activity');
    });
  });
});

export {}; 