import { prisma } from './prisma';

export class InventoryService {
  /**
   * Update product stock level and create an inventory log entry
   */
  static async updateStock(
    productId: string,
    quantity: number,
    type: 'RESTOCK' | 'SALE' | 'ADJUSTMENT' | 'RETURN',
    userId: string,
    reason?: string,
    reference?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Get current product
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Calculate new stock level
      const newStock = product.currentStock + quantity;
      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }

      // Update product stock and status
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: newStock,
          inventoryStatus: this.calculateInventoryStatus(newStock, product.lowStockThreshold),
          lastRestockDate: type === 'RESTOCK' ? new Date() : undefined,
        },
      });

      // Create inventory log entry
      const log = await tx.inventoryLog.create({
        data: {
          productId,
          type,
          quantity,
          reason,
          createdBy: userId,
          reference,
        },
      });

      // Check if reorder is needed
      if (newStock <= product.reorderPoint) {
        // TODO: Implement reorder notification system
        console.log(`Reorder needed for product ${productId}`);
      }

      return { product: updatedProduct, log };
    });
  }

  /**
   * Get inventory status based on current stock and threshold
   */
  private static calculateInventoryStatus(currentStock: number, lowStockThreshold: number): string {
    if (currentStock <= 0) {
      return 'OUT_OF_STOCK';
    }
    if (currentStock <= lowStockThreshold) {
      return 'LOW_STOCK';
    }
    return 'IN_STOCK';
  }

  /**
   * Get inventory logs for a product
   */
  static async getInventoryLogs(productId: string, limit = 10, offset = 0) {
    return await prisma.inventoryLog.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        product: {
          select: {
            name: true,
            unit: true,
          },
        },
      },
    });
  }

  /**
   * Update inventory settings for a product
   */
  static async updateInventorySettings(
    productId: string,
    settings: {
      lowStockThreshold?: number;
      reorderPoint?: number;
      reorderQuantity?: number;
    }
  ) {
    return await prisma.product.update({
      where: { id: productId },
      data: settings,
    });
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(supplierId: string) {
    return await prisma.product.findMany({
      where: {
        supplierId,
        OR: [
          { inventoryStatus: 'LOW_STOCK' },
          { inventoryStatus: 'OUT_OF_STOCK' },
        ],
      },
      orderBy: { currentStock: 'asc' },
    });
  }

  /**
   * Process order and update inventory
   */
  static async processOrder(
    orderId: string,
    userId: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Update inventory for each item
      for (const item of order.items) {
        await this.updateStock(
          item.productId,
          -item.quantity, // Negative quantity for sales
          'SALE',
          userId,
          'Order fulfillment',
          orderId,
        );
      }

      return order;
    });
  }
} 