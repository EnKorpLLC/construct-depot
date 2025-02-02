import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { OrderStatus } from '@prisma/client';
import * as orderRoutes from '@/app/api/orders/route';
import { getServerSession } from 'next-auth';
import { MockSession } from '../../setup';

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

describe('Order API Endpoints', () => {
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

    // Create test order
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

  describe('GET /api/orders', () => {
    it('should return unauthorized for unauthenticated requests', async () => {
      // Mock session to return null
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET'
      });

      await orderRoutes.GET(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Unauthorized'
      });
    });

    it('should list orders for authenticated user', async () => {
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
        query: {
          page: '1',
          limit: '10'
        }
      });

      await orderRoutes.GET(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.orders).toHaveLength(1);
      expect(data.pagination).toBeDefined();
    });

    it('should filter orders by status', async () => {
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
        query: {
          status: OrderStatus.DRAFT
        }
      });

      await orderRoutes.GET(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.orders).toHaveLength(1);
      expect(data.orders[0].status).toBe(OrderStatus.DRAFT);
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order for authenticated user', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: testUser.id,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      } as MockSession);

      const orderData = {
        supplierId: testSupplier.id,
        items: [{
          productId: testProduct.id,
          quantity: 2,
          unitPrice: 99.99
        }]
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: orderData
      });

      await orderRoutes.POST(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.status).toBe(OrderStatus.DRAFT);
      expect(data.totalAmount).toBe(199.98); // 2 * 99.99
    });

    it('should validate required fields', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: testUser.id,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      } as MockSession);

      const invalidData = {
        // Missing supplierId
        items: []  // Empty items array
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: invalidData
      });

      await orderRoutes.POST(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Invalid request data');
    });

    it('should validate item quantities and prices', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: testUser.id,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      } as MockSession);

      const invalidData = {
        supplierId: testSupplier.id,
        items: [{
          productId: testProduct.id,
          quantity: -1,  // Invalid quantity
          unitPrice: 0   // Invalid price
        }]
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: invalidData
      });

      await orderRoutes.POST(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Invalid request data');
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors gracefully', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: testUser.id,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      } as MockSession);

      // Mock prisma to throw an error
      jest.spyOn(prisma.order, 'create').mockRejectedValue(new Error('Database error'));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          supplierId: testSupplier.id,
          items: [{
            productId: testProduct.id,
            quantity: 1,
            unitPrice: 99.99
          }]
        }
      });

      await orderRoutes.POST(req as unknown as NextRequest);
      
      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Internal server error');
    });
  });
}); 