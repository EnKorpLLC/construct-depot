import { OrderWorkflowService } from '../services/OrderWorkflowService';
import { OrderStatus, UserRole } from '@prisma/client';
import { prismaMock } from '../../__tests__/mocks/prisma';

describe('OrderWorkflowService', () => {
  const mockOrder = {
    id: '1',
    status: OrderStatus.PENDING,
    userId: 'user1',
    user: {
      id: 'user1',
      role: UserRole.CUSTOMER,
    },
    items: [
      {
        id: '1',
        productId: 'prod1',
        quantity: 2,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.order.findUnique.mockResolvedValue(mockOrder);
    prismaMock.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.PROCESSING });
  });

  describe('updateOrderStatus', () => {
    it('should successfully update order status', async () => {
      const result = await OrderWorkflowService.updateOrderStatus(
        '1',
        OrderStatus.PROCESSING,
        UserRole.ADMIN
      );

      expect(result.status).toBe(OrderStatus.PROCESSING);
      expect(prismaMock.order.update).toHaveBeenCalled();
    });

    it('should handle pooling status transition correctly', async () => {
      const result = await OrderWorkflowService.updateOrderStatus(
        '1',
        OrderStatus.POOLING,
        UserRole.ADMIN
      );

      expect(result.status).toBe(OrderStatus.POOLING);
    });

    it('should prevent invalid status transitions', async () => {
      await expect(
        OrderWorkflowService.updateOrderStatus(
          '1',
          OrderStatus.DELIVERED,
          UserRole.ADMIN
        )
      ).rejects.toThrow('Invalid status transition');
    });

    it('should validate user permissions', async () => {
      await expect(
        OrderWorkflowService.updateOrderStatus(
          '1',
          OrderStatus.PROCESSING,
          UserRole.CUSTOMER
        )
      ).rejects.toThrow('User does not have permission');
    });
  });

  describe('handleStatusSpecificActions', () => {
    it('should reserve inventory when status changes to PROCESSING', async () => {
      prismaMock.product.update.mockResolvedValue({ id: 'prod1', currentStock: 8 });

      await OrderWorkflowService.handleStatusSpecificActions(
        mockOrder,
        OrderStatus.PROCESSING
      );

      expect(prismaMock.product.update).toHaveBeenCalled();
    });

    it('should release inventory when order is cancelled from PROCESSING', async () => {
      const processingOrder = { ...mockOrder, status: OrderStatus.PROCESSING };
      prismaMock.product.update.mockResolvedValue({ id: 'prod1', currentStock: 12 });

      await OrderWorkflowService.handleStatusSpecificActions(
        processingOrder,
        OrderStatus.CANCELLED
      );

      expect(prismaMock.product.update).toHaveBeenCalled();
    });
  });
}); 