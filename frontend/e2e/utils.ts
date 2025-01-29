import { Page } from '@playwright/test';
import prisma from '@/lib/prisma';
import { OrderStatus, Prisma } from '@prisma/client';

export async function setupE2ETest() {
  // Clear test data
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create test supplier
  const supplier = await prisma.user.create({
    data: {
      email: 'test-supplier@example.com',
      firstName: 'Test',
      lastName: 'Supplier',
      password: 'test-password-123', // In real app, this would be hashed
      role: 'SUPPLIER',
      companyName: 'Test Supply Co.',
      supplierStatus: 'APPROVED'
    }
  });

  // Create test products
  await prisma.product.createMany({
    data: [
      {
        name: 'Test Product 1',
        description: 'Test product description',
        price: new Prisma.Decimal(100.00),
        minOrderQuantity: 10,
        unit: 'pieces',
        supplierId: supplier.id,
        categories: ['test'],
        currentStock: 100,
        reorderPoint: 20
      },
      {
        name: 'Test Product 2',
        description: 'Another test product',
        price: new Prisma.Decimal(150.00),
        minOrderQuantity: 5,
        unit: 'pieces',
        supplierId: supplier.id,
        categories: ['test'],
        currentStock: 15,
        reorderPoint: 25
      }
    ]
  });

  // Create test orders with proper relationships
  const timestamp = Date.now();
  const orderData: Prisma.OrderCreateInput[] = [
    {
      orderNumber: `ORD-${timestamp}-001`,
      status: OrderStatus.PROCESSING,
      totalAmount: new Prisma.Decimal(1000.00),
      currency: 'USD',
      user: { connect: { id: supplier.id } },
      supplier: { connect: { id: supplier.id } }
    },
    {
      orderNumber: `ORD-${timestamp}-002`,
      status: OrderStatus.DELIVERED,
      totalAmount: new Prisma.Decimal(1500.00),
      currency: 'USD',
      user: { connect: { id: supplier.id } },
      supplier: { connect: { id: supplier.id } }
    }
  ];

  await prisma.$transaction(
    orderData.map(data => prisma.order.create({ data }))
  );
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