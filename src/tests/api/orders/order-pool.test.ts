import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { OrderStatus } from '@prisma/client';
import * as orderPoolRoutes from '@/app/api/orders/pool/route';
import { getServerSession } from 'next-auth';
import { MockSession } from '../../setup';

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

describe('Order Pool API Endpoints', () => {
  let testUser: any;
  let testSupplier: any;
  let testProduct: any;
  let testOrder: any;

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: await hash('password123', 12),
        role: 'user'
      }
    });

    // Create test supplier
    testSupplier = await prisma.user.create({
      data: {
        email: 'supplier@example.com',
        name: 'Test Supplier',
        password: await hash('password123', 12),
        role: 'SUPPLIER'
      }
    });

    // Create test product
    testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        inventory: 100,
        supplierId: testSupplier.id,
        supplier: {
          connect: {
            id: testSupplier.id
          }
        }
      }
    });

    // Create test order in pooling status
    testOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        totalAmount: 99.99,
        status: OrderStatus.PENDING,
        items: {
          create: {
            productId: testProduct.id,
            quantity: 1,
            price: 99.99
          }
        }
      }
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('GET /api/orders/pool', () => {
    it('should list active pools', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: testUser.id,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      } as MockSession);

      const { req, res } = createMocks({
        method: 'GET'
      });

      await orderPoolRoutes.GET(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(Array.isArray(data.pools)).toBe(true);
      expect(data.pools.length).toBeGreaterThan(0);
      expect(data.pools[0].status).toBe(OrderStatus.POOLING);
    });

    it('should filter pools by product', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: testUser.id,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      } as MockSession);

      const { req, res } = createMocks({
        method: 'GET',
        query: { productId: testProduct.id }
      });

      await orderPoolRoutes.GET(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.pools.every((pool: any) => 
        pool.items.some((item: any) => item.productId === testProduct.id)
      )).toBe(true);
    });
  });

  describe('POST /api/orders/pool/join', () => {
    it('should join existing pool', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: testUser.id,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      } as MockSession);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          poolId: testOrder.id,
          quantity: 5
        }
      });

      await orderPoolRoutes.POST(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.status).toBe(OrderStatus.POOLING);
      expect(data.items[0].quantity).toBe(5);
    });

    it('should validate minimum order quantity', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: testUser.id,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      } as MockSession);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          poolId: testOrder.id,
          quantity: 1 // Less than minimum
        }
      });

      await orderPoolRoutes.POST(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(400);
      const error = JSON.parse(res._getData());
      expect(error.message).toContain('minimum order quantity');
    });

    it('should handle expired pools', async () => {
      // Update test order to be expired
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { poolExpiry: new Date(Date.now() - 1000) }
      });

      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: testUser.id,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      } as MockSession);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          poolId: testOrder.id,
          quantity: 5
        }
      });

      await orderPoolRoutes.POST(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(400);
      const error = JSON.parse(res._getData());
      expect(error.message).toContain('expired');
    });
  });

  describe('POST /api/orders/pool/create', () => {
    it('should create new pool', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: testUser.id,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      } as MockSession);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: testProduct.id,
          quantity: 5,
          expiryHours: 24
        }
      });

      await orderPoolRoutes.POST(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.status).toBe(OrderStatus.POOLING);
      expect(data.items[0].productId).toBe(testProduct.id);
      expect(data.poolExpiry).toBeDefined();
    });

    it('should validate product existence', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: testUser.id,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      } as MockSession);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          productId: 'non-existent-id',
          quantity: 5,
          expiryHours: 24
        }
      });

      await orderPoolRoutes.POST(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(404);
    });
  });
}); 