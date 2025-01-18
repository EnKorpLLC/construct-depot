import { OrderService } from '../orders';
import { prisma } from '../prisma';
import { OrderStatus, PooledOrderStatus } from '@prisma/client';
import { TaxService } from '../tax';

// Mock Prisma
jest.mock('../prisma', () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    pooledOrder: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    inventory: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

// Mock TaxService
jest.mock('../tax', () => ({
  TaxService: {
    calculateTax: jest.fn(),
  },
}));

describe('Order Pooling System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Pool Creation and Thresholds', () => {
    it('should create a new pool when minimum order quantity is not met', async () => {
      const mockProduct = {
        id: 'prod-1',
        minOrderQuantity: 100,
        currentPrice: 10,
        supplierId: 'supplier-1',
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.pooledOrder.findFirst as jest.Mock).mockResolvedValue(null);

      const orderItems = [{ productId: 'prod-1', quantity: 50 }];
      
      await OrderService.createOrder(
        'user-1',
        orderItems,
        '123 Test St',
        500,
        50,
        false
      );

      expect(prisma.pooledOrder.create).toHaveBeenCalled();
      expect(prisma.order.create).toHaveBeenCalled();
    });

    it('should add to existing pool when available', async () => {
      const mockProduct = {
        id: 'prod-1',
        minOrderQuantity: 100,
        currentPrice: 10,
        supplierId: 'supplier-1',
      };

      const mockPool = {
        id: 'pool-1',
        status: 'PENDING',
        currentQuantity: 50,
        targetQuantity: 100,
        productId: 'prod-1',
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.pooledOrder.findFirst as jest.Mock).mockResolvedValue(mockPool);

      const orderItems = [{ productId: 'prod-1', quantity: 25 }];
      
      await OrderService.createOrder(
        'user-2',
        orderItems,
        '456 Test Ave',
        250,
        25,
        false
      );

      expect(prisma.pooledOrder.update).toHaveBeenCalled();
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pooledOrderId: 'pool-1',
          }),
        })
      );
    });
  });

  describe('Pool Status Transitions', () => {
    it('should trigger pool completion when threshold is met', async () => {
      const mockPool = {
        id: 'pool-1',
        status: 'PENDING',
        currentQuantity: 90,
        targetQuantity: 100,
        productId: 'prod-1',
      };

      const mockProduct = {
        id: 'prod-1',
        minOrderQuantity: 100,
        currentPrice: 10,
        supplierId: 'supplier-1',
      };

      (prisma.pooledOrder.findFirst as jest.Mock).mockResolvedValue(mockPool);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const orderItems = [{ productId: 'prod-1', quantity: 10 }];
      
      await OrderService.createOrder(
        'user-3',
        orderItems,
        '789 Test Blvd',
        100,
        10,
        false
      );

      expect(prisma.pooledOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PROCESSING',
          }),
        })
      );
    });

    it('should update all orders in pool when pool status changes', async () => {
      const mockPool = {
        id: 'pool-1',
        status: 'PROCESSING',
        orders: [
          { id: 'order-1' },
          { id: 'order-2' },
        ],
      };

      (prisma.pooledOrder.findUnique as jest.Mock).mockResolvedValue(mockPool);

      await OrderService.updatePooledOrderStatus('pool-1', 'COMPLETED');

      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { pooledOrderId: 'pool-1' },
        data: { status: 'COMPLETED' },
      });
    });
  });

  describe('Inventory Integration', () => {
    it('should check inventory availability before adding to pool', async () => {
      const mockProduct = {
        id: 'prod-1',
        minOrderQuantity: 100,
        currentPrice: 10,
        supplierId: 'supplier-1',
      };

      const mockInventory = {
        id: 'inv-1',
        quantity: 200,
        productId: 'prod-1',
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.inventory.findFirst as jest.Mock).mockResolvedValue(mockInventory);

      const orderItems = [{ productId: 'prod-1', quantity: 150 }];
      
      await OrderService.createOrder(
        'user-4',
        orderItems,
        '101 Test Lane',
        1500,
        150,
        false
      );

      expect(prisma.inventory.findFirst).toHaveBeenCalled();
      expect(prisma.order.create).toHaveBeenCalled();
    });

    it('should throw error when inventory is insufficient', async () => {
      const mockProduct = {
        id: 'prod-1',
        minOrderQuantity: 100,
        currentPrice: 10,
        supplierId: 'supplier-1',
      };

      const mockInventory = {
        id: 'inv-1',
        quantity: 50,
        productId: 'prod-1',
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.inventory.findFirst as jest.Mock).mockResolvedValue(mockInventory);

      const orderItems = [{ productId: 'prod-1', quantity: 100 }];
      
      await expect(
        OrderService.createOrder(
          'user-5',
          orderItems,
          '102 Test Road',
          1000,
          100,
          false
        )
      ).rejects.toThrow('Insufficient inventory');
    });
  });

  describe('Tax Integration', () => {
    it('should calculate and include tax in pooled orders', async () => {
      const mockProduct = {
        id: 'prod-1',
        minOrderQuantity: 100,
        currentPrice: 10,
        supplierId: 'supplier-1',
      };

      (TaxService.calculateTax as jest.Mock).mockResolvedValue(50);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const orderItems = [{ productId: 'prod-1', quantity: 50 }];
      
      await OrderService.createOrder(
        'user-6',
        orderItems,
        '103 Test Circle',
        500,
        50,
        false
      );

      expect(TaxService.calculateTax).toHaveBeenCalled();
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            taxAmount: 50,
          }),
        })
      );
    });
  });
}); 