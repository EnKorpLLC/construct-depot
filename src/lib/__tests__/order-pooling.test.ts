import { OrderService } from '../orders';
import { prismaMock } from '../../__tests__/mocks/prisma';
import { OrderStatus } from '@prisma/client';

describe('Order Pooling System', () => {
  const mockProducts = [
    {
      id: 'prod1',
      supplierId: 'supplier1',
      currentStock: 10,
      minOrderQuantity: 5,
    },
    {
      id: 'prod2',
      supplierId: 'supplier1',
      currentStock: 15,
      minOrderQuantity: 8,
    },
  ];

  const mockItems = [
    {
      productId: 'prod1',
      quantity: 3,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.product.findMany.mockResolvedValue(mockProducts);
    prismaMock.order.create.mockResolvedValue({
      id: 'order1',
      status: OrderStatus.PENDING,
      items: mockItems,
    });
  });

  describe('Pool Creation and Thresholds', () => {
    it('should create a new pool when minimum order quantity is not met', async () => {
      const result = await OrderService.createOrder(mockItems, 'user1', false);

      expect(result.status).toBe(OrderStatus.POOLING);
      expect(prismaMock.order.create).toHaveBeenCalled();
    });

    it('should add to existing pool when available', async () => {
      prismaMock.order.findMany.mockResolvedValue([
        {
          id: 'pool1',
          status: OrderStatus.POOLING,
          items: mockItems,
        },
      ]);

      const result = await OrderService.createOrder(mockItems, 'user1', false);

      expect(result.pooledOrderId).toBe('pool1');
    });
  });

  describe('Pool Status Transitions', () => {
    it('should trigger pool completion when threshold is met', async () => {
      const pooledItems = [
        {
          productId: 'prod1',
          quantity: 5,
        },
      ];

      prismaMock.order.findMany.mockResolvedValue([
        {
          id: 'pool1',
          status: OrderStatus.POOLING,
          items: pooledItems,
        },
      ]);

      const result = await OrderService.createOrder(mockItems, 'user1', false);

      expect(result.status).toBe(OrderStatus.PROCESSING);
    });

    it('should update all orders in pool when pool status changes', async () => {
      await OrderService.updatePooledOrderStatus('pool-1', OrderStatus.COMPLETED);

      expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
        where: { pooledOrderId: 'pool-1' },
        data: { status: OrderStatus.COMPLETED },
      });
    });
  });

  describe('Inventory Integration', () => {
    it('should check inventory availability before adding to pool', async () => {
      const result = await OrderService.createOrder(mockItems, 'user1', false);

      expect(result).toBeDefined();
      expect(prismaMock.product.findMany).toHaveBeenCalled();
    });

    it('should throw error when inventory is insufficient', async () => {
      const largeOrder = [
        {
          productId: 'prod1',
          quantity: 20,
        },
      ];

      await expect(
        OrderService.createOrder(largeOrder, 'user1', false)
      ).rejects.toThrow('Insufficient inventory');
    });
  });

  describe('Tax Integration', () => {
    it('should calculate and include tax in pooled orders', async () => {
      const result = await OrderService.createOrder(mockItems, 'user1', false);

      expect(result.totalTax).toBeDefined();
      expect(typeof result.totalTax).toBe('number');
    });
  });
}); 