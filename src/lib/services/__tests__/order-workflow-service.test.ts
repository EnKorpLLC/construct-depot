import { OrderWorkflowService } from '../OrderWorkflowService';
import { OrderStatus, Role } from '@prisma/client';
import { prismaMock } from '../../../__tests__/mocks/prisma';

describe('OrderWorkflowService', () => {
  const mockOrder = {
    id: '1',
    status: OrderStatus.PENDING,
    userId: 'user1',
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
  });

  describe('updateOrderStatus', () => {
    it('should successfully update order status', async () => {
      prismaMock.order.findUnique.mockResolvedValue(mockOrder);
      prismaMock.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PROCESSING,
      });

      const result = await OrderWorkflowService.updateOrderStatus(
        mockOrder.id,
        OrderStatus.PROCESSING,
        Role.super_admin
      );

      expect(result.status).toBe(OrderStatus.PROCESSING);
      expect(prismaMock.order.update).toHaveBeenCalled();
    });

    it('should handle pooling status transition correctly', async () => {
      prismaMock.order.findUnique.mockResolvedValue(mockOrder);
      prismaMock.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.POOLING,
      });

      const result = await OrderWorkflowService.updateOrderStatus(
        mockOrder.id,
        OrderStatus.POOLING,
        Role.super_admin
      );

      expect(result.status).toBe(OrderStatus.POOLING);
    });

    it('should prevent invalid status transitions', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      });

      await expect(
        OrderWorkflowService.updateOrderStatus(
          mockOrder.id,
          OrderStatus.PROCESSING,
          Role.super_admin
        )
      ).rejects.toThrow('Invalid status transition');
    });

    it('should validate user permissions', async () => {
      prismaMock.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        OrderWorkflowService.updateOrderStatus(
          mockOrder.id,
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

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        data: {
          currentStock: {
            decrement: 2
          }
        }
      });
    });

    it('should release inventory when order is cancelled from PROCESSING', async () => {
      const processingOrder = { ...mockOrder, status: OrderStatus.PROCESSING };
      prismaMock.product.update.mockResolvedValue({ id: 'prod1', currentStock: 12 });

      await OrderWorkflowService.handleStatusSpecificActions(
        processingOrder,
        OrderStatus.CANCELLED
      );

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        data: {
          currentStock: {
            increment: 2
          }
        }
      });
    });
  });
}); 