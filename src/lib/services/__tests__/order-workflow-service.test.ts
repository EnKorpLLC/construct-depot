import { OrderStatus, Order, OrderItem, Product } from '@prisma/client';
import { OrderWorkflowService } from '../OrderWorkflowService';
import { prismaMock } from '../../prisma/singleton';

describe('OrderWorkflowService', () => {
  let service: OrderWorkflowService;
  
  beforeEach(() => {
    service = new OrderWorkflowService();
  });

  describe('updateOrderStatus', () => {
    const mockOrder: Order & { items: OrderItem[] } = {
      id: 'order1',
      status: OrderStatus.PENDING,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalAmount: 100,
      poolGroupId: null,
      poolProgress: null,
      poolDeadline: null,
      items: [
        {
          id: 'item1',
          productId: 'prod1',
          quantity: 2,
          price: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
          orderId: 'order1'
        }
      ]
    };

    it('should update order status and handle inventory for processing', async () => {
      prismaMock.order.findUnique.mockResolvedValue(mockOrder);
      
      const mockProduct: Product = {
        id: 'prod1',
        name: 'Test Product',
        description: 'Test Description',
        price: 50,
        inventory: 10,
        supplierId: 'supplier1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.product.findUnique.mockResolvedValue(mockProduct);
      prismaMock.product.update.mockResolvedValue({ ...mockProduct, inventory: 8 });
      prismaMock.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.PROCESSING });

      await service.updateOrderStatus(mockOrder, OrderStatus.PROCESSING);

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        data: { inventory: 8 }
      });
    });

    it('should restore inventory when cancelling order', async () => {
      const processingOrder: Order & { items: OrderItem[] } = {
        ...mockOrder,
        status: OrderStatus.PROCESSING
      };

      prismaMock.order.findUnique.mockResolvedValue(processingOrder);
      
      const mockProduct: Product = {
        id: 'prod1',
        name: 'Test Product',
        description: 'Test Description',
        price: 50,
        inventory: 8,
        supplierId: 'supplier1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.product.findUnique.mockResolvedValue(mockProduct);
      prismaMock.product.update.mockResolvedValue({ ...mockProduct, inventory: 10 });
      prismaMock.order.update.mockResolvedValue({ ...processingOrder, status: OrderStatus.CANCELLED });

      await service.updateOrderStatus(processingOrder, OrderStatus.CANCELLED);

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        data: { inventory: 10 }
      });
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