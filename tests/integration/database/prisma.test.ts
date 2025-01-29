import { describe, expect, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

const prisma = new PrismaClient();

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.order.deleteMany();
    await prisma.user.deleteMany();
    await prisma.product.deleteMany();
  });

  describe('User Operations', () => {
    it('should create and retrieve users', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashedPassword123'
        }
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');

      const retrieved = await prisma.user.findUnique({
        where: { id: user.id }
      });

      expect(retrieved).toBeDefined();
      expect(retrieved?.email).toBe(user.email);
    });

    it('should handle unique email constraint', async () => {
      await prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          name: 'First User',
          password: 'hashedPassword123'
        }
      });

      await expect(
        prisma.user.create({
          data: {
            email: 'duplicate@example.com',
            name: 'Second User',
            password: 'hashedPassword456'
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('Order Operations', () => {
    it('should create order with items', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'order.test@example.com',
          name: 'Order Test User',
          password: 'hashedPassword123'
        }
      });

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          status: 'PENDING',
          totalAmount: 299.99,
          items: {
            create: [
              {
                productId: 'PROD-1',
                quantity: 2,
                price: 149.99
              }
            ]
          }
        },
        include: {
          items: true
        }
      });

      expect(order.id).toBeDefined();
      expect(order.items).toHaveLength(1);
      expect(order.totalAmount).toBe(299.99);
    });

    it('should update order status', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'status.test@example.com',
          name: 'Status Test User',
          password: 'hashedPassword123'
        }
      });

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          status: 'PENDING',
          totalAmount: 99.99
        }
      });

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PROCESSING' }
      });

      expect(updated.status).toBe('PROCESSING');
    });
  });

  describe('Product Operations', () => {
    it('should manage product inventory', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          price: 99.99,
          stockQuantity: 100
        }
      });

      const updated = await prisma.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: {
            decrement: 5
          }
        }
      });

      expect(updated.stockQuantity).toBe(95);
    });

    it('should handle bulk updates', async () => {
      const products = await prisma.product.createMany({
        data: [
          { name: 'Product 1', price: 10.99, stockQuantity: 50 },
          { name: 'Product 2', price: 20.99, stockQuantity: 30 }
        ]
      });

      expect(products.count).toBe(2);

      const updated = await prisma.product.updateMany({
        where: {
          stockQuantity: {
            lt: 40
          }
        },
        data: {
          stockQuantity: 100
        }
      });

      expect(updated.count).toBeGreaterThan(0);
    });
  });
}); 