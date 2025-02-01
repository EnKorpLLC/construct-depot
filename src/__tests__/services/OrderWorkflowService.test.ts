import { OrderWorkflowService } from '@/lib/services/OrderWorkflowService';
import { OrderStatus, Role } from '@prisma/client';
import { prismaMock } from '../mocks/prisma';
import { mockOrder, mockProduct } from '../utils/mock-data';

describe('OrderWorkflowService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateOrderStatus', () => {
    it('should update order status for admin', async () => {
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
    });

    it('should validate status transitions', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.COMPLETED,
      });

      await expect(
        OrderWorkflowService.updateOrderStatus(
          mockOrder.id,
          OrderStatus.PROCESSING,
          Role.super_admin
        )
      ).rejects.toThrow('Invalid status transition');
    });

    it('should enforce role-based permissions', async () => {
      prismaMock.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        OrderWorkflowService.updateOrderStatus(
          mockOrder.id,
          OrderStatus.PROCESSING,
          Role.user
        )
      ).rejects.toThrow('User does not have permission');
    });

    it('should handle pooling status transition correctly', async () => {
      const pooledOrder = {
        ...mockOrder,
        status: OrderStatus.POOLING,
      };

      prismaMock.order.findUnique.mockResolvedValue(pooledOrder);
      prismaMock.order.update.mockResolvedValue({
        ...pooledOrder,
        status: OrderStatus.PROCESSING,
      });

      const result = await OrderWorkflowService.updateOrderStatus(
        pooledOrder.id,
        OrderStatus.PROCESSING,
        Role.super_admin
      );

      expect(result.status).toBe(OrderStatus.PROCESSING);
    });

    it('should prevent invalid status transitions', async () => {
      const deliveredOrder = {
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      };

      prismaMock.order.findUnique.mockResolvedValue(deliveredOrder);

      await expect(
        OrderWorkflowService.updateOrderStatus(
          deliveredOrder.id,
          OrderStatus.PROCESSING,
          Role.super_admin
        )
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('handleStatusSpecificActions', () => {
    it('should reserve inventory when status changes to PROCESSING', async () => {
      prismaMock.product.update.mockResolvedValue({
        ...mockProduct,
        currentStock: mockProduct.currentStock - mockOrder.items[0].quantity,
      });

      await OrderWorkflowService.handleStatusSpecificActions(
        mockOrder,
        OrderStatus.PROCESSING
      );

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: mockOrder.items[0].productId },
        data: expect.any(Object),
      });
    });

    it('should release inventory when order is cancelled from PROCESSING', async () => {
      const processingOrder = {
        ...mockOrder,
        status: OrderStatus.PROCESSING,
      };

      prismaMock.product.update.mockResolvedValue({
        ...mockProduct,
        currentStock: mockProduct.currentStock + mockOrder.items[0].quantity,
      });

      await OrderWorkflowService.handleStatusSpecificActions(
        processingOrder,
        OrderStatus.CANCELLED
      );

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: processingOrder.items[0].productId },
        data: expect.any(Object),
      });
    });
  });
}); 