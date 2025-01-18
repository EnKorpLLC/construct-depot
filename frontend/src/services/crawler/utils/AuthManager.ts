import { Page } from 'puppeteer';
import { AuthType } from '../types';

interface Credentials {
  username?: string;
  password?: string;
  apiKey?: string;
}

export class AuthManager {
  async authenticate(
    page: Page,
    authType: AuthType,
    credentials?: Credentials
  ): Promise<void> {
    if (!credentials) {
      throw new Error('Credentials are required for authentication');
    }

    switch (authType) {
      case AuthType.API_KEY:
        await this.handleApiKeyAuth(page, credentials.apiKey);
        break;
      case AuthType.BASIC_AUTH:
        await this.handleBasicAuth(page, credentials);
        break;
      case AuthType.FORM_LOGIN:
        await this.handleFormLogin(page, credentials);
        break;
      case AuthType.NONE:
        // No authentication needed
        break;
      default:
        throw new Error(`Unsupported authentication type: ${authType}`);
    }
  }

  private async handleApiKeyAuth(page: Page, apiKey?: string): Promise<void> {
    if (!apiKey) {
      throw new Error('API key is required for API key authentication');
    }

    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${apiKey}`,
    });
  }

  private async handleBasicAuth(
    page: Page,
    credentials: Credentials
  ): Promise<void> {
    if (!credentials.username || !credentials.password) {
      throw new Error('Username and password are required for basic authentication');
    }

    await page.authenticate({
      username: credentials.username,
      password: credentials.password,
    });
  }

  private async handleFormLogin(
    page: Page,
    credentials: Credentials
  ): Promise<void> {
    if (!credentials.username || !credentials.password) {
      throw new Error('Username and password are required for form login');
    }

    try {
      // Wait for the login form to be available
      await page.waitForSelector('form');

      // Find common username/email input fields
      const usernameSelector = [
        'input[type="text"][name="username"]',
        'input[type="email"][name="email"]',
        'input[type="text"][name="user"]',
        'input[type="email"][name="user"]',
        'input[id="username"]',
        'input[id="email"]',
      ].join(',');

      // Find common password input fields
      const passwordSelector = [
        'input[type="password"][name="password"]',
        'input[type="password"][name="pass"]',
        'input[id="password"]',
        'input[id="pass"]',
      ].join(',');

      // Find common submit buttons
      const submitSelector = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Login")',
        'button:contains("Sign In")',
      ].join(',');

      // Fill in the credentials
      await page.type(usernameSelector, credentials.username);
      await page.type(passwordSelector, credentials.password);

      // Submit the form
      await Promise.all([
        page.waitForNavigation(),
        page.click(submitSelector),
      ]);

      // Verify login success
      await this.verifyLoginSuccess(page);
    } catch (error) {
      throw new Error(`Form login failed: ${error.message}`);
    }
  }

  private async verifyLoginSuccess(page: Page): Promise<void> {
    // Common login failure indicators
    const failureSelectors = [
      '.error-message',
      '.alert-error',
      '#login-error',
      '.login-failed',
      'text/Invalid username or password',
      'text/Login failed',
    ];

    // Check for error messages
    for (const selector of failureSelectors) {
      const errorElement = await page.$(selector);
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        throw new Error(`Login failed: ${errorText}`);
      }
    }

    // Additional checks can be added here based on specific supplier requirements
  }
} 