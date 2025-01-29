import { OrderService } from '../orders';
import { prisma } from '../prisma';
import { OrderStatus, PooledOrderStatus } from '@prisma/client';

// Mock Prisma
jest.mock('../prisma', () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    pooledOrder: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserOrders', () => {
    it('should fetch supplier orders correctly', async () => {
      const mockOrders = [
        {
          id: '1',
          status: 'PENDING',
          items: [],
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      const result = await OrderService.getUserOrders('supplier-1', 'SUPPLIER');

      expect(result.orders).toEqual(mockOrders);
      expect(result.total).toBe(1);
    });
  });

  describe('getSupplierPooledOrders', () => {
    it('should fetch pooled orders correctly', async () => {
      const mockPooledOrders = [
        {
          id: '1',
          status: 'PROCESSING',
          orders: [],
        },
      ];

      (prisma.pooledOrder.findMany as jest.Mock).mockResolvedValue(mockPooledOrders);

      const result = await OrderService.getSupplierPooledOrders('supplier-1');

      expect(result).toEqual(mockPooledOrders);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status correctly', async () => {
      const mockOrder = {
        id: '1',
        status: 'PENDING',
        supplierId: 'supplier-1',
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'PROCESSING',
      });

      const result = await OrderService.updateOrderStatus(
        '1',
        'PROCESSING',
        'supplier-1'
      );

      expect(result.status).toBe('PROCESSING');
    });

    it('should throw error for unauthorized update', async () => {
      (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        OrderService.updateOrderStatus('1', 'PROCESSING', 'wrong-supplier')
      ).rejects.toThrow('Order not found or unauthorized');
    });
  });

  describe('createOrder', () => {
    it('should create order and handle pooling correctly', async () => {
      const mockProducts = [
        {
          id: '1',
          supplierId: 'supplier-1',
          price: 100,
          minOrderQuantity: 10,
        },
      ];

      const mockOrder = {
        id: '1',
        status: 'PENDING',
        items: [
          {
            productId: '1',
            quantity: 5,
          },
        ],
      };

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.pooledOrder.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.pooledOrder.create as jest.Mock).mockResolvedValue({
        id: 'pool-1',
        status: 'PROCESSING',
      });

      const result = await OrderService.createOrder(
        'user-1',
        [{ productId: '1', quantity: 5 }],
        '123 Test St',
        500,
        50,
        false
      );

      expect(result).toHaveLength(1);
      expect(prisma.pooledOrder.create).toHaveBeenCalled();
    });
  });

  describe('updatePooledOrderStatus', () => {
    it('should update pooled order and associated orders', async () => {
      const mockPooledOrder = {
        id: '1',
        status: 'PROCESSING',
        orders: [{ id: 'order-1' }, { id: 'order-2' }],
      };

      (prisma.pooledOrder.findUnique as jest.Mock).mockResolvedValue(mockPooledOrder);
      (prisma.pooledOrder.update as jest.Mock).mockResolvedValue({
        ...mockPooledOrder,
        status: 'COMPLETED',
      });

      const result = await OrderService.updatePooledOrderStatus('1', 'COMPLETED');

      expect(result.status).toBe('COMPLETED');
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { pooledOrderId: '1' },
        data: { status: 'PROCESSING' },
      });
    });

    it('should throw error for non-existent pooled order', async () => {
      (prisma.pooledOrder.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        OrderService.updatePooledOrderStatus('1', 'COMPLETED')
      ).rejects.toThrow('Pooled order not found');
    });
  });
}); 