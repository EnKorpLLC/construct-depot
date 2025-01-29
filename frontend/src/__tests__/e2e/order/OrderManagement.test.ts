import { test, expect } from '@playwright/test';
import { setupE2ETest } from '@/lib/test/e2e-setup';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

test.describe('Order Management E2E Tests', () => {
  let customerToken: string;
  let supplierToken: string;
  let adminToken: string;

  test.beforeAll(async () => {
    // Setup test users with different roles
    const { token: custToken } = await setupE2ETest({ role: 'CUSTOMER' });
    const { token: suppToken } = await setupE2ETest({ role: 'SUPPLIER' });
    const { token: admToken } = await setupE2ETest({ role: 'ADMIN' });
    
    customerToken = custToken;
    supplierToken = suppToken;
    adminToken = admToken;
  });

  test.beforeEach(async () => {
    // Clean up test data
    await prisma.order.deleteMany();
    await prisma.orderItem.deleteMany();
  });

  test('customer should be able to create a new order', async ({ page }) => {
    await page.goto('/orders/new');
    
    // Fill order details
    await page.getByLabel('Product').selectOption('test-product-1');
    await page.getByLabel('Quantity').fill('100');
    await page.getByLabel('Delivery Date').fill('2025-02-01');
    await page.getByRole('button', { name: 'Create Order' }).click();
    
    // Verify order creation
    await expect(page.getByText('Order created successfully')).toBeVisible();
    await expect(page.getByText('Order #')).toBeVisible();
    
    // Verify order status
    await expect(page.getByText('Status: Pending')).toBeVisible();
  });

  test('supplier should be able to view and process orders', async ({ page }) => {
    // Create test order
    const order = await prisma.order.create({
      data: {
        status: OrderStatus.PENDING,
        customerId: 'test-customer-id',
        items: {
          create: [{
            productId: 'test-product-1',
            quantity: 100,
            unitPrice: 10.00
          }]
        }
      }
    });

    await page.goto('/supplier/orders');
    
    // Verify order is visible
    await expect(page.getByText(`Order #${order.id}`)).toBeVisible();
    
    // Process order
    await page.getByRole('button', { name: 'Process Order' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Verify status change
    await expect(page.getByText('Status: Processing')).toBeVisible();
  });

  test('admin should be able to manage orders', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Verify order management features
    await expect(page.getByText('Order Management')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filter Orders' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export Orders' })).toBeVisible();
    
    // Test filtering
    await page.getByRole('button', { name: 'Filter Orders' }).click();
    await page.getByLabel('Status').selectOption('PENDING');
    await page.getByRole('button', { name: 'Apply Filters' }).click();
    
    // Verify filter results
    await expect(page.getByText('Filtered Results')).toBeVisible();
  });

  test('should handle order updates in real-time', async ({ page }) => {
    // Create test order
    const order = await prisma.order.create({
      data: {
        status: OrderStatus.PENDING,
        customerId: 'test-customer-id',
        items: {
          create: [{
            productId: 'test-product-1',
            quantity: 100,
            unitPrice: 10.00
          }]
        }
      }
    });

    await page.goto(`/orders/${order.id}`);
    
    // Update order status through API
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PROCESSING }
    });
    
    // Verify real-time update
    await expect(page.getByText('Status: Processing')).toBeVisible();
  });

  test('should validate order inputs', async ({ page }) => {
    await page.goto('/orders/new');
    
    // Try to submit without required fields
    await page.getByRole('button', { name: 'Create Order' }).click();
    
    // Verify validation messages
    await expect(page.getByText('Product is required')).toBeVisible();
    await expect(page.getByText('Quantity is required')).toBeVisible();
    await expect(page.getByText('Delivery date is required')).toBeVisible();
    
    // Test invalid quantity
    await page.getByLabel('Product').selectOption('test-product-1');
    await page.getByLabel('Quantity').fill('-1');
    await page.getByLabel('Delivery Date').fill('2025-02-01');
    await page.getByRole('button', { name: 'Create Order' }).click();
    
    await expect(page.getByText('Quantity must be greater than 0')).toBeVisible();
  });

  test('should handle payment flow', async ({ page }) => {
    // Create test order
    const order = await prisma.order.create({
      data: {
        status: OrderStatus.PENDING,
        customerId: 'test-customer-id',
        items: {
          create: [{
            productId: 'test-product-1',
            quantity: 100,
            unitPrice: 10.00
          }]
        }
      }
    });

    await page.goto(`/orders/${order.id}/payment`);
    
    // Fill payment details
    await page.getByLabel('Card Number').fill('4242424242424242');
    await page.getByLabel('Expiry').fill('12/25');
    await page.getByLabel('CVC').fill('123');
    await page.getByRole('button', { name: 'Pay Now' }).click();
    
    // Verify payment success
    await expect(page.getByText('Payment successful')).toBeVisible();
    await expect(page.getByText('Status: Paid')).toBeVisible();
  });
}); 