import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { EmailService } from './EmailService';

export interface Notification {
  id: string;
  userId: string;
  type: 'ORDER_STATUS_CHANGE' | 'POOL_PROGRESS' | 'POOL_COMPLETE' | 'SYSTEM';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Creates a notification for order status change
   */
  static async createOrderStatusNotification(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    userId: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) return;

    const title = this.getStatusChangeTitle(fromStatus, toStatus);
    const message = this.getStatusChangeMessage(order, fromStatus, toStatus);

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'ORDER_STATUS_CHANGE',
        title,
        message,
        metadata: {
          orderId,
          fromStatus,
          toStatus,
          items: order.items.map(item => ({
            productName: item.product.name,
            quantity: item.quantity,
          })),
        },
      },
    });

    // Send email notification
    await EmailService.sendOrderStatusEmail(
      order.user.email,
      orderId,
      fromStatus,
      toStatus,
      order.items.map(item => ({
        productName: item.product.name,
        quantity: item.quantity,
      }))
    );
  }

  /**
   * Creates a notification for pool progress
   */
  static async createPoolProgressNotification(
    orderId: string,
    currentQuantity: number,
    targetQuantity: number,
    remainingQuantity: number
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) return;

    const progress = (currentQuantity / targetQuantity) * 100;
    const title = 'Pool Progress Update';
    const message = `Your order for ${order.items[0].product.name} is ${progress.toFixed(0)}% complete. Need ${remainingQuantity} more units to complete the pool.`;

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: order.user.id,
        type: 'POOL_PROGRESS',
        title,
        message,
        metadata: {
          orderId,
          productId: order.items[0].product.id,
          currentQuantity,
          targetQuantity,
          remainingQuantity,
          progress,
        },
      },
    });

    // Send email notification
    await EmailService.sendPoolProgressEmail(
      order.user.email,
      orderId,
      order.items[0].product.name,
      currentQuantity,
      targetQuantity,
      remainingQuantity
    );
  }

  /**
   * Creates a notification when a pool is complete
   */
  static async createPoolCompleteNotification(
    orderId: string,
    productId: string
  ) {
    const pooledOrders = await prisma.order.findMany({
      where: {
        status: 'POOLING',
        items: {
          some: {
            productId,
          },
        },
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    for (const order of pooledOrders) {
      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: order.user.id,
          type: 'POOL_COMPLETE',
          title: 'Pool Complete!',
          message: `The pool for ${order.items[0].product.name} is now complete! Your order will be processed soon.`,
          metadata: {
            orderId: order.id,
            productId,
            totalOrders: pooledOrders.length,
          },
        },
      });

      // Send email notification
      await EmailService.sendPoolCompleteEmail(
        order.user.email,
        order.id,
        order.items[0].product.name
      );
    }
  }

  /**
   * Gets notifications for a user
   */
  static async getUserNotifications(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Marks notifications as read
   */
  static async markAsRead(notificationIds: string[]) {
    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
      },
      data: {
        read: true,
      },
    });
  }

  /**
   * Gets the title for a status change notification
   */
  private static getStatusChangeTitle(
    fromStatus: OrderStatus,
    toStatus: OrderStatus
  ): string {
    switch (toStatus) {
      case 'POOLING':
        return 'Order Added to Pool';
      case 'PENDING':
        return 'Order Ready for Processing';
      case 'PROCESSING':
        return 'Order Being Processed';
      case 'CONFIRMED':
        return 'Order Confirmed';
      case 'SHIPPED':
        return 'Order Shipped';
      case 'DELIVERED':
        return 'Order Delivered';
      case 'CANCELLED':
        return 'Order Cancelled';
      default:
        return 'Order Status Updated';
    }
  }

  /**
   * Gets the message for a status change notification
   */
  private static getStatusChangeMessage(
    order: any,
    fromStatus: OrderStatus,
    toStatus: OrderStatus
  ): string {
    const itemNames = order.items
      .map((item: any) => `${item.quantity}x ${item.product.name}`)
      .join(', ');

    switch (toStatus) {
      case 'POOLING':
        return `Your order for ${itemNames} has been added to a pool. We'll notify you when the pool is complete.`;
      case 'PENDING':
        return `Your pooled order for ${itemNames} is now complete and ready for processing.`;
      case 'PROCESSING':
        return `We've started processing your order for ${itemNames}.`;
      case 'CONFIRMED':
        return `Your order for ${itemNames} has been confirmed and will be shipped soon.`;
      case 'SHIPPED':
        return `Great news! Your order for ${itemNames} has been shipped.`;
      case 'DELIVERED':
        return `Your order for ${itemNames} has been delivered. Thank you for shopping with us!`;
      case 'CANCELLED':
        return `Your order for ${itemNames} has been cancelled.`;
      default:
        return `Your order status has been updated from ${fromStatus} to ${toStatus}.`;
    }
  }
} 