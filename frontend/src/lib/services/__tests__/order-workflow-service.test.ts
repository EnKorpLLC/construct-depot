import { OrderWorkflowService } from '../OrderWorkflowService';
import { OrderStatus, UserRole } from '@/types/prisma';
import { PrismaClient } from '@prisma/client';
import { mockApiResponse, mockErrorResponse } from '@/lib/test-utils';

jest.mock('@prisma/client');

describe('OrderWorkflowService', () => {
  let mockPrismaClient: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = new PrismaClient() as jest.Mocked<PrismaClient>;
  });

  describe('createOrder', () => {
    const orderData = {
      userId: 'test-user-id',
      items: [
        {
          productId: 'test-product-id',
          quantity: 2,
          price: 100,
        },
      ],
      shippingAddress: '123 Test St',
      shippingCity: 'Test City',
      shippingState: 'TS',
      shippingZip: '12345',
    };

    it('should create a new order successfully', async () => {
      const mockOrder = {
        id: 'test-order-id',
        status: OrderStatus.PENDING,
        ...orderData,
      };

      mockPrismaClient.order.create.mockResolvedValue(mockOrder as any);

      const result = await OrderWorkflowService.createOrder(orderData);
      expect(result).toEqual(mockOrder);
      expect(mockPrismaClient.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining(orderData),
      });
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        ...orderData,
        items: [],
      };

      await expect(OrderWorkflowService.createOrder(invalidData)).rejects.toThrow(
        'Order must contain at least one item'
      );
    });
  });

  describe('updateOrderStatus', () => {
    const updateData = {
      orderId: 'test-order-id',
      userId: 'test-user-id',
      userRole: UserRole.ADMIN,
      currentStatus: OrderStatus.PENDING,
      targetStatus: OrderStatus.PROCESSING,
      metadata: {
        note: 'Status update test',
      },
    };

    it('should update order status successfully', async () => {
      const mockOrder = {
        id: 'test-order-id',
        status: OrderStatus.PROCESSING,
        userId: 'test-user-id',
      };

      mockPrismaClient.order.update.mockResolvedValue(mockOrder as any);

      const result = await OrderWorkflowService.updateOrderStatus(updateData);
      expect(result).toEqual(mockOrder);
      expect(mockPrismaClient.order.update).toHaveBeenCalledWith({
        where: { id: updateData.orderId },
        data: expect.objectContaining({ status: updateData.targetStatus }),
      });
    });

    it('should handle invalid status transitions', async () => {
      const invalidUpdate = {
        ...updateData,
        targetStatus: OrderStatus.DELIVERED,
      };

      await expect(OrderWorkflowService.updateOrderStatus(invalidUpdate)).rejects.toThrow(
        'Invalid status transition'
      );
    });
  });

  describe('getOrderHistory', () => {
    const orderId = 'test-order-id';

    it('should retrieve order history successfully', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          orderId,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PROCESSING,
          timestamp: new Date(),
        },
      ];

      mockPrismaClient.orderHistory.findMany.mockResolvedValue(mockHistory as any);

      const result = await OrderWorkflowService.getOrderHistory(orderId);
      expect(result).toEqual(mockHistory);
      expect(mockPrismaClient.orderHistory.findMany).toHaveBeenCalledWith({
        where: { orderId },
        orderBy: { timestamp: 'desc' },
      });
    });
  });

  describe('processOrderPayment', () => {
    const paymentData = {
      orderId: 'test-order-id',
      amount: 200,
      currency: 'USD',
      paymentMethod: 'stripe',
    };

    it('should process payment successfully', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'succeeded',
        amount: paymentData.amount,
      };

      global.fetch = jest.fn().mockImplementation(() =>
        mockApiResponse({
          payment: mockPayment,
        })
      );

      const result = await OrderWorkflowService.processOrderPayment(paymentData);
      expect(result).toEqual(mockPayment);
    });

    it('should handle payment failures', async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        mockErrorResponse(400, 'Payment failed')
      );

      await expect(OrderWorkflowService.processOrderPayment(paymentData)).rejects.toThrow(
        'Payment failed'
      );
    });
  });

  describe('calculateOrderTotals', () => {
    const orderItems = [
      { quantity: 2, price: 100 },
      { quantity: 1, price: 50 },
    ];

    it('should calculate order totals correctly', () => {
      const result = OrderWorkflowService.calculateOrderTotals(orderItems);
      expect(result).toEqual({
        subtotal: 250,
        tax: expect.any(Number),
        total: expect.any(Number),
      });
    });
  });
}); 