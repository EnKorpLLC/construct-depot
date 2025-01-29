import { OrderWorkflowService } from '@/lib/services/OrderWorkflowService';
import { OrderStatus, UserRole } from '@/types/prisma';
import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/services/NotificationService';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  order: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  orderHistory: {
    create: jest.fn(),
  },
  product: {
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(prisma)),
}));

jest.mock('@/lib/services/NotificationService', () => ({
  NotificationService: {
    createOrderStatusNotification: jest.fn(),
    createPoolCompleteNotification: jest.fn(),
  },
}));

describe('OrderWorkflowService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateOrderStatus', () => {
    const mockOrder = {
      id: '1',
      status: 'PENDING' as OrderStatus,
      items: [
        {
          productId: '1',
          quantity: 5,
          product: {
            currentStock: 10,
            name: 'Test Product',
          },
        },
      ],
      user: {
        id: 'user-1',
      },
    };

    it('should successfully update order status', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'PROCESSING',
      });

      const result = await OrderWorkflowService.updateOrderStatus(
        '1',
        'PROCESSING',
        'admin-1',
        'ADMIN'
      );

      expect(result.status).toBe('PROCESSING');
      expect(prisma.orderHistory.create).toHaveBeenCalled();
      expect(NotificationService.createOrderStatusNotification).toHaveBeenCalled();
    });

    it('should handle pooling status transition correctly', async () => {
      const poolingOrder = {
        ...mockOrder,
        status: 'POOLING',
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(poolingOrder);
      (OrderWorkflowService as any).checkMinimumQuantityMet = jest.fn().mockResolvedValue(true);

      await OrderWorkflowService.updateOrderStatus(
        '1',
        'PENDING',
        'admin-1',
        'ADMIN'
      );

      expect(NotificationService.createPoolCompleteNotification).toHaveBeenCalled();
    });

    it('should prevent invalid status transitions', async () => {
      const deliveredOrder = {
        ...mockOrder,
        status: 'DELIVERED',
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(deliveredOrder);

      await expect(
        OrderWorkflowService.updateOrderStatus(
          '1',
          'PROCESSING',
          'admin-1',
          'ADMIN'
        )
      ).rejects.toThrow('Invalid status transition');
    });

    it('should validate user permissions', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      await expect(
        OrderWorkflowService.updateOrderStatus(
          '1',
          'PROCESSING',
          'user-1',
          'CUSTOMER'
        )
      ).rejects.toThrow('User does not have permission');
    });
  });

  describe('handleStatusSpecificActions', () => {
    const mockOrder = {
      id: '1',
      status: 'PENDING',
      items: [
        {
          productId: '1',
          quantity: 5,
          product: {
            currentStock: 10,
          },
        },
      ],
    };

    it('should reserve inventory when status changes to PROCESSING', async () => {
      await (OrderWorkflowService as any).handleStatusSpecificActions(
        mockOrder,
        'PROCESSING'
      );

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          currentStock: { decrement: 5 },
          reservedStock: { increment: 5 },
        },
      });
    });

    it('should release inventory when order is cancelled from PROCESSING', async () => {
      const processingOrder = { ...mockOrder, status: 'PROCESSING' };

      await (OrderWorkflowService as any).handleStatusSpecificActions(
        processingOrder,
        'CANCELLED'
      );

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          currentStock: { increment: 5 },
          reservedStock: { decrement: 5 },
        },
      });
    });
  });
}); 