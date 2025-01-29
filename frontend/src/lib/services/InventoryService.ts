import { prisma } from '@/lib/prisma';
import { NotificationService } from './NotificationService';

export interface StockUpdateResult {
  success: boolean;
  currentStock: number;
  message: string;
  needsReorder: boolean;
}

export class InventoryService {
  static async updateStock(
    productId: string,
    quantity: number,
    type: 'RESTOCK' | 'SALE' | 'ADJUSTMENT' | 'RETURN',
    userId: string,
    reference?: string
  ): Promise<StockUpdateResult> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const newStock = product.currentStock + quantity;
    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    // Update stock and create log entry in a transaction
    const [updatedProduct, _] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: {
          currentStock: newStock,
          inventoryStatus: this.calculateInventoryStatus(newStock, product.lowStockThreshold),
          lastRestockDate: type === 'RESTOCK' ? new Date() : product.lastRestockDate,
        },
      }),
      prisma.inventoryLog.create({
        data: {
          productId,
          type,
          quantity,
          createdBy: userId,
          reference,
          reason: this.generateLogReason(type, quantity, reference),
        },
      }),
    ]);

    // Check if we need to send notifications
    const needsReorder = this.checkReorderPoint(updatedProduct);
    if (needsReorder) {
      await NotificationService.createLowStockNotification(productId);
    }

    return {
      success: true,
      currentStock: updatedProduct.currentStock,
      message: `Stock updated successfully. New stock level: ${updatedProduct.currentStock}`,
      needsReorder,
    };
  }

  private static calculateInventoryStatus(
    currentStock: number,
    lowStockThreshold: number
  ): string {
    if (currentStock <= 0) return 'OUT_OF_STOCK';
    if (currentStock <= lowStockThreshold) return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  private static generateLogReason(
    type: string,
    quantity: number,
    reference?: string
  ): string {
    const action = quantity >= 0 ? 'increased' : 'decreased';
    const amount = Math.abs(quantity);
    return `Stock ${action} by ${amount} units due to ${type.toLowerCase()}${
      reference ? ` (Ref: ${reference})` : ''
    }`;
  }

  private static checkReorderPoint(product: {
    currentStock: number;
    reorderPoint: number;
    reorderQuantity: number;
  }): boolean {
    return product.currentStock <= product.reorderPoint;
  }

  static async getReorderSuggestions() {
    const lowStockProducts = await prisma.product.findMany({
      where: {
        currentStock: {
          lte: prisma.product.fields.reorderPoint,
        },
        isActive: true,
      },
      include: {
        supplier: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return lowStockProducts.map(product => ({
      productId: product.id,
      productName: product.name,
      currentStock: product.currentStock,
      reorderQuantity: product.reorderQuantity,
      supplier: product.supplier,
    }));
  }

  static async getStockHistory(
    productId: string,
    limit: number = 10
  ) {
    return prisma.inventoryLog.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: limit,
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
} 