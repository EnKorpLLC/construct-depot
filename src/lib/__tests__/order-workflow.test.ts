import { OrderWorkflowService } from '../services/OrderWorkflowService';
import { OrderStatus, Role } from '@prisma/client';
import { prismaMock } from '../../__tests__/mocks/prisma';
import { OrderWorkflow } from '../order-workflow';

describe('OrderWorkflowService', () => {
  const mockOrder = {
    id: '1',
    status: OrderStatus.PENDING,
    userId: 'user1',
    user: {
      id: 'user1',
      role: Role.user,
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
        Role.super_admin
      );

      expect(result.status).toBe(OrderStatus.PROCESSING);
      expect(prismaMock.order.update).toHaveBeenCalled();
    });

    it('should handle pooling status transition correctly', async () => {
      const result = await OrderWorkflowService.updateOrderStatus(
        '1',
        OrderStatus.POOLING,
        Role.super_admin
      );

      expect(result.status).toBe(OrderStatus.POOLING);
    });

    it('should prevent invalid status transitions', async () => {
      await expect(
        OrderWorkflowService.updateOrderStatus(
          '1',
          OrderStatus.DELIVERED,
          Role.super_admin
        )
      ).rejects.toThrow('Invalid status transition');
    });

    it('should validate user permissions', async () => {
      await expect(
        OrderWorkflowService.updateOrderStatus(
          '1',
          OrderStatus.PROCESSING,
          Role.user
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