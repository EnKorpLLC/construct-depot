import { OrderStatus, Role, Order, Product } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class OrderWorkflowService {
  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userRole: Role
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate user permissions
    if (userRole === Role.user) {
      throw new Error('User does not have permission');
    }

    // Validate status transition
    if (!this.isValidStatusTransition(order.status, newStatus)) {
      throw new Error('Invalid status transition');
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus }
    });

    // Handle any status-specific actions
    await this.handleStatusSpecificActions(order, newStatus);

    return updatedOrder;
  }

  private static isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.DRAFT]: [OrderStatus.PENDING],
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.POOLING],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.POOLING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private static async handleStatusSpecificActions(order: Order, newStatus: OrderStatus): Promise<void> {
    // Update inventory based on status change
    if (newStatus === OrderStatus.PROCESSING) {
      // Decrease inventory
      const product = await prisma.product.findUnique({
        where: { id: order.productId }
      });
      if (product) {
        await prisma.product.update({
          where: { id: order.productId },
          data: { inventory: product.inventory - order.quantity }
        });
      }
    } else if (newStatus === OrderStatus.CANCELLED) {
      // Restore inventory
      const product = await prisma.product.findUnique({
        where: { id: order.productId }
      });
      if (product) {
        await prisma.product.update({
          where: { id: order.productId },
          data: { inventory: product.inventory + order.quantity }
        });
      }
    }
  }
} 