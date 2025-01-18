import { test, expect } from '@playwright/test';
import { setupE2ETest } from '@/lib/test/e2e-setup';
import { prisma } from '@/lib/prisma';

test.describe('User Management E2E Tests', () => {
  let adminToken: string;

  test.beforeAll(async () => {
    const { token } = await setupE2ETest({ role: 'SUPER_ADMIN' });
    adminToken = token;
  });

  test.beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-'
        }
      }
    });
  });

  test('should create new user', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Click create user button
    await page.getByRole('button', { name: 'Add User' }).click();
    
    // Fill user details
    await page.getByLabel('Email').fill('test-user@example.com');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Role').selectOption('CUSTOMER');
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Verify user creation
    await expect(page.getByText('User created successfully')).toBeVisible();
    await expect(page.getByText('test-user@example.com')).toBeVisible();
  });

  test('should edit existing user', async ({ page }) => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-edit@example.com',
        name: 'Test Edit User',
        role: 'CUSTOMER'
      }
    });

    await page.goto('/admin/users');
    
    // Find and click edit button
    await page.getByRole('button', { name: `Edit ${user.name}` }).click();
    
    // Update user details
    await page.getByLabel('Name').fill('Updated Test User');
    await page.getByLabel('Role').selectOption('SUPPLIER');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Verify updates
    await expect(page.getByText('User updated successfully')).toBeVisible();
    await expect(page.getByText('Updated Test User')).toBeVisible();
    await expect(page.getByText('SUPPLIER')).toBeVisible();
  });

  test('should delete user', async ({ page }) => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-delete@example.com',
        name: 'Test Delete User',
        role: 'CUSTOMER'
      }
    });

    await page.goto('/admin/users');
    
    // Find and click delete button
    await page.getByRole('button', { name: `Delete ${user.name}` }).click();
    
    // Confirm deletion
    await page.getByRole('button', { name: 'Confirm Delete' }).click();
    
    // Verify deletion
    await expect(page.getByText('User deleted successfully')).toBeVisible();
    await expect(page.getByText(user.email)).not.toBeVisible();
  });

  test('should filter users', async ({ page }) => {
    // Create test users
    await prisma.user.createMany({
      data: [
        { email: 'test-customer@example.com', name: 'Test Customer', role: 'CUSTOMER' },
        { email: 'test-supplier@example.com', name: 'Test Supplier', role: 'SUPPLIER' },
        { email: 'test-admin@example.com', name: 'Test Admin', role: 'ADMIN' }
      ]
    });

    await page.goto('/admin/users');
    
    // Test role filter
    await page.getByLabel('Role').selectOption('SUPPLIER');
    await page.getByRole('button', { name: 'Apply Filters' }).click();
    
    // Verify filtered results
    await expect(page.getByText('test-supplier@example.com')).toBeVisible();
    await expect(page.getByText('test-customer@example.com')).not.toBeVisible();
    
    // Test search
    await page.getByPlaceholder('Search users...').fill('Customer');
    await page.getByRole('button', { name: 'Apply Filters' }).click();
    
    // Verify search results
    await expect(page.getByText('test-customer@example.com')).toBeVisible();
    await expect(page.getByText('test-supplier@example.com')).not.toBeVisible();
  });

  test('should handle permissions correctly', async ({ page }) => {
    // Create test users with different roles
    const customer = await prisma.user.create({
      data: {
        email: 'test-customer@example.com',
        name: 'Test Customer',
        role: 'CUSTOMER'
      }
    });

    // Try to access user management as customer
    const { token } = await setupE2ETest({ role: 'CUSTOMER' });
    await page.goto('/admin/users');
    
    // Verify access denied
    await expect(page.getByText('Access Denied')).toBeVisible();
    
    // Switch to admin
    await page.evaluate(() => {
      localStorage.setItem('token', adminToken);
    });
    await page.reload();
    
    // Verify admin access
    await expect(page.getByText('User Management')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible();
  });

  test('should validate user inputs', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Click create user button
    await page.getByRole('button', { name: 'Add User' }).click();
    
    // Try to submit without required fields
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Verify validation messages
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Role is required')).toBeVisible();
    
    // Test invalid email
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByRole('button', { name: 'Create' }).click();
    
    await expect(page.getByText('Invalid email format')).toBeVisible();
  });
}); 