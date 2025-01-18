import { OrderWorkflowService, OrderWorkflowError } from '../services/OrderWorkflowService';
import { prisma } from '../prisma';
import { OrderStatus, UserRole } from '@prisma/client';

// Mock prisma
jest.mock('../prisma', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    orderHistory: {
      create: jest.fn(),
    },
  },
}));

describe('OrderWorkflowService', () => {
  const mockOrder = {
    id: '1',
    status: 'PENDING' as OrderStatus,
    items: [
      {
        productId: '1',
        quantity: 5,
        product: {
          id: '1',
          name: 'Test Product',
          currentStock: 10,
        },
      },
    ],
    shippingAddress: null,
  };

  const mockUser = {
    id: '1',
    role: 'SUPPLIER' as UserRole,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'Test Product',
      currentStock: 10,
    });
    (prisma.order.update as jest.Mock).mockResolvedValue({
      ...mockOrder,
      status: 'PROCESSING',
    });
  });

  describe('updateOrderStatus', () => {
    it('should successfully update order status', async () => {
      const result = await OrderWorkflowService.updateOrderStatus(
        '1',
        'PROCESSING',
        mockUser.id,
        mockUser.role
      );

      expect(result.status).toBe('PROCESSING');
      expect(prisma.orderHistory.create).toHaveBeenCalled();
      expect(prisma.order.update).toHaveBeenCalled();
    });

    it('should throw error for invalid transition', async () => {
      await expect(
        OrderWorkflowService.updateOrderStatus(
          '1',
          'DELIVERED',
          mockUser.id,
          mockUser.role
        )
      ).rejects.toThrow(OrderWorkflowError);
    });

    it('should throw error for insufficient permissions', async () => {
      await expect(
        OrderWorkflowService.updateOrderStatus(
          '1',
          'PROCESSING',
          mockUser.id,
          'CUSTOMER' as UserRole
        )
      ).rejects.toThrow(OrderWorkflowError);
    });

    it('should throw error for insufficient stock', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        name: 'Test Product',
        currentStock: 2,
      });

      await expect(
        OrderWorkflowService.updateOrderStatus(
          '1',
          'PROCESSING',
          mockUser.id,
          mockUser.role
        )
      ).rejects.toThrow('Insufficient stock');
    });

    it('should throw error for missing shipping address', async () => {
      await expect(
        OrderWorkflowService.updateOrderStatus(
          '1',
          'SHIPPED',
          mockUser.id,
          mockUser.role
        )
      ).rejects.toThrow('Shipping address is required');
    });

    it('should handle inventory for processing status', async () => {
      await OrderWorkflowService.updateOrderStatus(
        '1',
        'PROCESSING',
        mockUser.id,
        mockUser.role
      );

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          currentStock: { decrement: 5 },
          reservedStock: { increment: 5 },
        },
      });
    });

    it('should handle inventory for cancelled status', async () => {
      mockOrder.status = 'PROCESSING';
      await OrderWorkflowService.updateOrderStatus(
        '1',
        'CANCELLED',
        mockUser.id,
        mockUser.role
      );

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          currentStock: { increment: 5 },
          reservedStock: { decrement: 5 },
        },
      });
    });

    it('should update product metrics for delivered status', async () => {
      mockOrder.status = 'SHIPPED';
      await OrderWorkflowService.updateOrderStatus(
        '1',
        'DELIVERED',
        mockUser.id,
        mockUser.role
      );

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          totalSales: { increment: 5 },
        },
      });
    });
  });
}); 