import { prisma } from '@/lib/prisma';
import { OrderStatus, UserRole } from '@prisma/client';
import { NotificationService } from './NotificationService';

export class OrderWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderWorkflowError';
  }
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  POOLING: ['PENDING', 'CANCELLED'],
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

const ROLE_PERMISSIONS: Record<UserRole, OrderStatus[]> = {
  SUPPLIER: ['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  CUSTOMER: ['CANCELLED'],
  ADMIN: ['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
};

export class OrderWorkflowService {
  /**
   * Validates if a status transition is allowed
   */
  private static validateTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Validates if a user has permission to make the status change
   */
  private static validatePermission(userRole: UserRole, newStatus: OrderStatus): boolean {
    const allowedStatuses = ROLE_PERMISSIONS[userRole] || [];
    return allowedStatuses.includes(newStatus);
  }

  /**
   * Checks if an order meets the minimum quantity requirements
   */
  private static async checkMinimumQuantityMet(order: any): Promise<boolean> {
    for (const item of order.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { minOrderQuantity: true },
      });

      if (!product) continue;

      // Get all active orders for this product that are in POOLING status
      const pooledOrders = await prisma.order.findMany({
        where: {
          status: 'POOLING',
          items: {
            some: {
              productId: item.productId,
            },
          },
        },
        include: {
          items: {
            where: {
              productId: item.productId,
            },
          },
        },
      });

      // Calculate total quantity including current order
      const totalQuantity = pooledOrders.reduce(
        (sum, order) => sum + order.items[0].quantity,
        0
      );

      if (totalQuantity < product.minOrderQuantity) {
        return false;
      }
    }
    return true;
  }

  /**
   * Updates the status of an order
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId: string,
    userRole: UserRole
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

    if (!order) {
      throw new OrderWorkflowError('Order not found');
    }

    // Special handling for POOLING status
    if (order.status === 'POOLING') {
      const isMinQuantityMet = await this.checkMinimumQuantityMet(order);
      if (isMinQuantityMet) {
        // Automatically transition to PENDING when minimum quantity is met
        newStatus = 'PENDING';
        // Notify all users in the pool
        await NotificationService.createPoolCompleteNotification(
          orderId,
          order.items[0].productId
        );
      } else if (newStatus !== 'CANCELLED') {
        throw new OrderWorkflowError(
          'Order cannot transition from POOLING until minimum quantity is met'
        );
      }
    }

    // Validate the transition
    if (!this.validateTransition(order.status, newStatus)) {
      throw new OrderWorkflowError(
        `Invalid status transition from ${order.status} to ${newStatus}`
      );
    }

    // Validate user permission
    if (!this.validatePermission(userRole, newStatus)) {
      throw new OrderWorkflowError(
        `User does not have permission to change status to ${newStatus}`
      );
    }

    // Additional validations based on status
    await this.validateStatusSpecificRules(order, newStatus);

    // Create order history entry
    await prisma.orderHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: newStatus,
        userId,
        note: `Status changed from ${order.status} to ${newStatus}`,
      },
    });

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    // Create notification for status change
    await NotificationService.createOrderStatusNotification(
      orderId,
      order.status,
      newStatus,
      order.user.id
    );

    // Trigger status-specific actions
    await this.handleStatusSpecificActions(updatedOrder, newStatus);

    // If transitioning from POOLING to PENDING, check other pooled orders
    if (order.status === 'POOLING' && newStatus === 'PENDING') {
      await this.checkAndUpdatePooledOrders(order.items[0].productId);
    }

    return updatedOrder;
  }

  /**
   * Check and update other pooled orders that might now meet minimum quantity
   */
  private static async checkAndUpdatePooledOrders(productId: string) {
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
        items: true,
      },
    });

    // Calculate current pool quantities
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { minOrderQuantity: true },
    });

    if (!product) return;

    const totalQuantity = pooledOrders.reduce(
      (sum, order) => sum + order.items[0].quantity,
      0
    );

    // Update pool progress for all orders
    for (const order of pooledOrders) {
      await NotificationService.createPoolProgressNotification(
        order.id,
        totalQuantity,
        product.minOrderQuantity,
        Math.max(0, product.minOrderQuantity - totalQuantity)
      );

      if (totalQuantity >= product.minOrderQuantity) {
        await this.updateOrderStatus(
          order.id,
          'PENDING',
          'SYSTEM',
          'ADMIN'
        );
      }
    }
  }

  /**
   * Validates rules specific to each status change
   */
  private static async validateStatusSpecificRules(order: any, newStatus: OrderStatus) {
    switch (newStatus) {
      case 'PROCESSING':
        // Check if all items are in stock
        for (const item of order.items) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
          });
          if (!product || product.currentStock < item.quantity) {
            throw new OrderWorkflowError(
              `Insufficient stock for product ${product?.name}`
            );
          }
        }
        break;

      case 'CONFIRMED':
        // Additional validation logic for confirmation
        break;

      case 'SHIPPED':
        // Validate shipping information exists
        if (!order.shippingAddress) {
          throw new OrderWorkflowError('Shipping address is required');
        }
        break;

      case 'CANCELLED':
        // Prevent cancellation if already shipped
        if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
          throw new OrderWorkflowError(
            'Cannot cancel order that has been shipped or delivered'
          );
        }
        break;
    }
  }

  /**
   * Handles actions that need to be taken when an order status changes
   */
  private static async handleStatusSpecificActions(order: any, newStatus: OrderStatus) {
    switch (newStatus) {
      case 'PROCESSING':
        // Reserve inventory
        await this.reserveInventory(order);
        break;

      case 'CANCELLED':
        // Release reserved inventory if was processing
        if (order.status === 'PROCESSING') {
          await this.releaseInventory(order);
        }
        break;

      case 'DELIVERED':
        // Update product sales metrics
        await this.updateProductMetrics(order);
        break;
    }
  }

  /**
   * Reserves inventory for an order
   */
  private static async reserveInventory(order: any) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          currentStock: {
            decrement: item.quantity,
          },
          reservedStock: {
            increment: item.quantity,
          },
        },
      });
    }
  }

  /**
   * Releases reserved inventory for a cancelled order
   */
  private static async releaseInventory(order: any) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          currentStock: {
            increment: item.quantity,
          },
          reservedStock: {
            decrement: item.quantity,
          },
        },
      });
    }
  }

  /**
   * Updates product metrics when an order is delivered
   */
  private static async updateProductMetrics(order: any) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          totalSales: {
            increment: item.quantity,
          },
        },
      });
    }
  }
} 