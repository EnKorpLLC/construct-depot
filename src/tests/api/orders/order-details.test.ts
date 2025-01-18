import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { OrderStatus } from '@prisma/client';
import * as orderDetailRoutes from '@/app/api/orders/[orderId]/route';

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

describe('Order Detail API Endpoints', () => {
  let testUser: any;
  let testSupplier: any;
  let testProduct: any;
  let testOrder: any;

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'Test User',
        password: await hash('password123', 12),
        role: 'USER'
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
        description: 'Test product description',
        price: 99.99,
        supplierId: testSupplier.id
      }
    });

    // Create test order
    testOrder = await prisma.order.create({
      data: {
        orderNumber: 'TEST-001',
        userId: testUser.id,
        supplierId: testSupplier.id,
        status: OrderStatus.DRAFT,
        totalAmount: 99.99,
        items: {
          create: {
            productId: testProduct.id,
            quantity: 1,
            unitPrice: 99.99,
            totalPrice: 99.99
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

  describe('GET /api/orders/[orderId]', () => {
    it('should return order details for owner', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { orderId: testOrder.id }
      });

      await orderDetailRoutes.GET(
        req as unknown as NextRequest,
        { params: { orderId: testOrder.id } }
      );
      
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.id).toBe(testOrder.id);
      expect(data.items).toBeDefined();
    });

    it('should return order details for supplier', async () => {
      // Mock authenticated session as supplier
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testSupplier.id }
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { orderId: testOrder.id }
      });

      await orderDetailRoutes.GET(
        req as unknown as NextRequest,
        { params: { orderId: testOrder.id } }
      );
      
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.id).toBe(testOrder.id);
    });

    it('should return 404 for non-existent order', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { orderId: 'non-existent-id' }
      });

      await orderDetailRoutes.GET(
        req as unknown as NextRequest,
        { params: { orderId: 'non-existent-id' } }
      );
      
      expect(res._getStatusCode()).toBe(404);
    });

    it('should return 403 for unauthorized access', async () => {
      // Mock authenticated session as different user
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'different-user-id' }
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { orderId: testOrder.id }
      });

      await orderDetailRoutes.GET(
        req as unknown as NextRequest,
        { params: { orderId: testOrder.id } }
      );
      
      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('PATCH /api/orders/[orderId]', () => {
    it('should update order status', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      });

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { orderId: testOrder.id },
        body: {
          status: OrderStatus.PENDING,
          notes: 'Status update test'
        }
      });

      await orderDetailRoutes.PATCH(
        req as unknown as NextRequest,
        { params: { orderId: testOrder.id } }
      );
      
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.status).toBe(OrderStatus.PENDING);
    });

    it('should validate status transitions', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      });

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { orderId: testOrder.id },
        body: {
          status: OrderStatus.DELIVERED, // Invalid transition from DRAFT
          notes: 'Invalid transition test'
        }
      });

      await orderDetailRoutes.PATCH(
        req as unknown as NextRequest,
        { params: { orderId: testOrder.id } }
      );
      
      expect(res._getStatusCode()).toBe(400);
    });
  });

  describe('DELETE /api/orders/[orderId]', () => {
    it('should cancel order', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      });

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { orderId: testOrder.id }
      });

      await orderDetailRoutes.DELETE(
        req as unknown as NextRequest,
        { params: { orderId: testOrder.id } }
      );
      
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.status).toBe(OrderStatus.CANCELLED);
    });

    it('should return 404 for non-existent order', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      });

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { orderId: 'non-existent-id' }
      });

      await orderDetailRoutes.DELETE(
        req as unknown as NextRequest,
        { params: { orderId: 'non-existent-id' } }
      );
      
      expect(res._getStatusCode()).toBe(404);
    });
  });
}); 