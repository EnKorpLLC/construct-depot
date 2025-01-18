import { InventoryService } from '@/lib/services/InventoryService';
import { NotificationService } from '@/lib/services/NotificationService';
import prisma from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  product: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  inventoryLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(prisma)),
}));

jest.mock('@/lib/services/NotificationService', () => ({
  NotificationService: {
    createLowStockNotification: jest.fn(),
  },
}));

describe('InventoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateStock', () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      currentStock: 100,
      lowStockThreshold: 20,
      reorderPoint: 30,
      reorderQuantity: 50,
    };

    it('should successfully update stock for restock operation', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        currentStock: 150,
      });

      const result = await InventoryService.updateStock(
        '1',
        50,
        'RESTOCK',
        'user-1',
        'Scheduled restock'
      );

      expect(result.success).toBe(true);
      expect(result.currentStock).toBe(150);
      expect(prisma.inventoryLog.create).toHaveBeenCalled();
    });

    it('should successfully update stock for sale operation', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        currentStock: 90,
      });

      const result = await InventoryService.updateStock(
        '1',
        -10,
        'SALE',
        'user-1',
        'Order #123'
      );

      expect(result.success).toBe(true);
      expect(result.currentStock).toBe(90);
      expect(prisma.inventoryLog.create).toHaveBeenCalled();
    });

    it('should throw error for insufficient stock', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      await expect(
        InventoryService.updateStock('1', -150, 'SALE', 'user-1')
      ).rejects.toThrow('Insufficient stock');
    });

    it('should create low stock notification when threshold is reached', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        currentStock: 15,
      });

      const result = await InventoryService.updateStock(
        '1',
        -85,
        'SALE',
        'user-1'
      );

      expect(result.needsReorder).toBe(true);
      expect(NotificationService.createLowStockNotification).toHaveBeenCalledWith('1');
    });
  });

  describe('getReorderSuggestions', () => {
    it('should return products that need reordering', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Low Stock Product',
          currentStock: 10,
          reorderPoint: 20,
          reorderQuantity: 50,
          supplier: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const suggestions = await InventoryService.getReorderSuggestions();

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].productId).toBe('1');
      expect(suggestions[0].reorderQuantity).toBe(50);
    });
  });

  describe('getStockHistory', () => {
    it('should return inventory logs for a product', async () => {
      const mockLogs = [
        {
          id: '1',
          type: 'RESTOCK',
          quantity: 50,
          createdAt: new Date(),
          product: {
            name: 'Test Product',
            unit: 'units',
          },
        },
      ];

      (prisma.inventoryLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

      const history = await InventoryService.getStockHistory('1');

      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('RESTOCK');
      expect(prisma.inventoryLog.findMany).toHaveBeenCalledWith({
        where: { productId: '1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          product: {
            select: {
              name: true,
              unit: true,
            },
          },
        },
      });
    });
  });

  describe('calculateInventoryStatus', () => {
    it('should return correct status based on stock levels', () => {
      expect(InventoryService['calculateInventoryStatus'](0, 10)).toBe('OUT_OF_STOCK');
      expect(InventoryService['calculateInventoryStatus'](5, 10)).toBe('LOW_STOCK');
      expect(InventoryService['calculateInventoryStatus'](15, 10)).toBe('IN_STOCK');
    });
  });
}); 