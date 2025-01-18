import { Page } from '@playwright/test';
import prisma from '@/lib/prisma';

export async function setupE2ETest() {
  // Clear test data
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create test supplier
  await prisma.user.create({
    data: {
      email: 'test-supplier@example.com',
      name: 'Test Supplier',
      role: 'SUPPLIER',
      password: 'test-password-123', // In real app, this would be hashed
    }
  });

  // Create test data
  await prisma.product.createMany({
    data: [
      {
        name: 'Test Product 1',
        sku: 'TP-001',
        currentStock: 100,
        reorderPoint: 20,
        supplierId: 1
      },
      {
        name: 'Test Product 2',
        sku: 'TP-002',
        currentStock: 15,
        reorderPoint: 25,
        supplierId: 1
      }
    ]
  });

  await prisma.order.createMany({
    data: [
      {
        orderNumber: 'ORD-001',
        status: 'PROCESSING',
        total: 1000,
        customerId: 1,
        supplierId: 1
      },
      {
        orderNumber: 'ORD-002',
        status: 'COMPLETED',
        total: 1500,
        customerId: 2,
        supplierId: 1
      }
    ]
  });
}

export async function loginAsSupplier(page: Page) {
  await page.goto('/auth/login');
  
  // Fill in login form
  await page.getByLabel('Email').fill('test-supplier@example.com');
  await page.getByLabel('Password').fill('test-password-123');
  
  // Submit form
  await page.getByRole('button', { name: 'Sign in' }).click();
  
  // Wait for navigation to complete
  await page.waitForURL('/supplier/dashboard');
}

export async function clearTestData() {
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
} 