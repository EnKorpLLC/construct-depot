import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const hashedPassword = await hash('testpass123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      role: 'user',
    },
  });

  // Create test supplier
  const supplier = await prisma.user.upsert({
    where: { email: 'supplier@example.com' },
    update: {},
    create: {
      email: 'supplier@example.com',
      name: 'Test Supplier',
      password: hashedPassword,
      role: 'supplier',
    },
  });

  // Create test products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'test-product-1' },
      update: {},
      create: {
        id: 'test-product-1',
        name: 'Test Product 1',
        description: 'A test product',
        price: 99.99,
        stock: 100,
        category: 'test',
      },
    }),
    prisma.product.upsert({
      where: { id: 'test-product-2' },
      update: {},
      create: {
        id: 'test-product-2',
        name: 'Test Product 2',
        description: 'Another test product',
        price: 149.99,
        stock: 50,
        category: 'test',
      },
    }),
  ]);

  // Create test orders
  const orders = await Promise.all([
    prisma.order.upsert({
      where: { id: 'test-order-1' },
      update: {},
      create: {
        id: 'test-order-1',
        userId: user.id,
        supplierId: supplier.id,
        status: 'processing',
        totalAmount: 299.97,
        items: [
          {
            productId: 'test-product-1',
            quantity: 3,
            price: 99.99,
          },
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
        },
      },
    }),
    prisma.order.upsert({
      where: { id: 'test-order-2' },
      update: {},
      create: {
        id: 'test-order-2',
        userId: user.id,
        supplierId: supplier.id,
        status: 'completed',
        totalAmount: 449.97,
        items: [
          {
            productId: 'test-product-2',
            quantity: 3,
            price: 149.99,
          },
        ],
        shippingAddress: {
          street: '456 Test Ave',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
        },
      },
    }),
  ]);

  // Create test analytics data
  const analytics = await Promise.all([
    prisma.analytics.create({
      data: {
        type: 'orders',
        data: {
          total: 2,
          revenue: 749.94,
          averageOrderValue: 374.97,
        },
      },
    }),
    prisma.analytics.create({
      data: {
        type: 'products',
        data: {
          totalProducts: 2,
          lowStock: 0,
          categories: ['test'],
        },
      },
    }),
  ]);

  console.log({
    user,
    supplier,
    products,
    orders,
    analytics,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 