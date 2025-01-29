import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import * as orderPaymentRoutes from '@/app/api/orders/[orderId]/payment/route';

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

describe('Order Payment API Endpoints', () => {
  let testUser: any;
  let testSupplier: any;
  let testProduct: any;
  let testOrder: any;
  let testPayment: any;

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
        orderNumber: 'PAY-001',
        userId: testUser.id,
        supplierId: testSupplier.id,
        status: OrderStatus.PENDING,
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

    // Create test payment
    testPayment = await prisma.payment.create({
      data: {
        orderId: testOrder.id,
        amount: 99.99,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        method: PaymentMethod.CREDIT_CARD
      }
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('GET /api/orders/[orderId]/payment', () => {
    it('should return payment details', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { orderId: testOrder.id }
      });

      await orderPaymentRoutes.GET(
        req as unknown as NextRequest,
        { params: { orderId: testOrder.id } }
      );
      
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.orderId).toBe(testOrder.id);
      expect(data.amount).toBe(99.99);
      expect(data.status).toBe(PaymentStatus.PENDING);
    });

    it('should return 404 for non-existent payment', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { orderId: 'non-existent-id' }
      });

      await orderPaymentRoutes.GET(
        req as unknown as NextRequest,
        { params: { orderId: 'non-existent-id' } }
      );
      
      expect(res._getStatusCode()).toBe(404);
    });
  });

  describe('POST /api/orders/[orderId]/payment', () => {
    it('should create payment for order', async () => {
      // Delete existing payment for this test
      await prisma.payment.delete({
        where: { id: testPayment.id }
      });

      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      });

      const { req, res } = createMocks({
        method: 'POST',
        query: { orderId: testOrder.id },
        body: {
          method: PaymentMethod.CREDIT_CARD,
          currency: 'USD',
          paymentDetails: {
            cardNumber: '**** **** **** 1234',
            expiryMonth: '12',
            expiryYear: '2025'
          }
        }
      });

      await orderPaymentRoutes.POST(
        req as unknown as NextRequest,
        { params: { orderId: testOrder.id } }
      );
      
      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.status).toBe(PaymentStatus.PENDING);
      expect(data.method).toBe(PaymentMethod.CREDIT_CARD);
    });

    it('should validate payment amount matches order total', async () => {
      // Delete existing payment for this test
      await prisma.payment.delete({
        where: { id: testPayment.id }
      });

      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      });

      const { req, res } = createMocks({
        method: 'POST',
        query: { orderId: testOrder.id },
        body: {
          method: PaymentMethod.CREDIT_CARD,
          amount: 50.00, // Incorrect amount
          currency: 'USD'
        }
      });

      await orderPaymentRoutes.POST(
        req as unknown as NextRequest,
        { params: { orderId: testOrder.id } }
      );
      
      expect(res._getStatusCode()).toBe(400);
      const error = JSON.parse(res._getData());
      expect(error.message).toContain('amount must match order total');
    });
  });

  describe('PATCH /api/orders/[orderId]/payment', () => {
    it('should update payment status', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      });

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { orderId: testOrder.id },
        body: {
          status: PaymentStatus.CAPTURED,
          transactionId: 'txn_123456'
        }
      });

      await orderPaymentRoutes.PATCH(
        req as unknown as NextRequest,
        { params: { orderId: testOrder.id } }
      );
      
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.status).toBe(PaymentStatus.CAPTURED);
      expect(data.transactionId).toBe('txn_123456');
    });

    it('should validate payment status transition', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      });

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { orderId: testOrder.id },
        body: {
          status: PaymentStatus.REFUNDED // Invalid transition from PENDING
        }
      });

      await orderPaymentRoutes.PATCH(
        req as unknown as NextRequest,
        { params: { orderId: testOrder.id } }
      );
      
      expect(res._getStatusCode()).toBe(400);
      const error = JSON.parse(res._getData());
      expect(error.message).toContain('Invalid payment status transition');
    });
  });
}); 