import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create test user
    const hashedPassword = await hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
      },
    });

    // Create user settings
    await prisma.orderSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        defaultShippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
        },
        defaultBillingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
        },
        preferredPaymentMethod: 'CREDIT_CARD',
        notificationSettings: {
          email: true,
          sms: false,
        },
      },
    });

    // Create test supplier
    const supplier = await prisma.user.upsert({
      where: { email: 'supplier@example.com' },
      update: {},
      create: {
        email: 'supplier@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Supplier',
        role: 'SUPPLIER',
        companyName: 'Test Supply Co',
        supplierStatus: 'APPROVED',
      },
    });

    // Create test products
    const product1 = await prisma.product.upsert({
      where: { id: 'test-product-1' },
      update: {},
      create: {
        id: 'test-product-1',
        name: 'Test Product 1',
        description: 'A test product',
        price: 99.99,
        minOrderQuantity: 10,
        unit: 'pieces',
        supplierId: supplier.id,
        categories: ['test', 'construction'],
        specifications: {
          weight: '10kg',
          dimensions: '10x10x10',
        },
      },
    });

    const product2 = await prisma.product.upsert({
      where: { id: 'test-product-2' },
      update: {},
      create: {
        id: 'test-product-2',
        name: 'Test Product 2',
        description: 'Another test product',
        price: 149.99,
        minOrderQuantity: 5,
        unit: 'pallets',
        supplierId: supplier.id,
        categories: ['test', 'materials'],
        specifications: {
          weight: '100kg',
          dimensions: '100x100x100',
        },
      },
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 