import { OrderStatus, Role, Order, Product, OrderItem } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class OrderWorkflowService {
  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userRole: Role
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
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

  static async handleStatusSpecificActions(order: Order & { items: any[] }, newStatus: OrderStatus) {
    if (newStatus === OrderStatus.PROCESSING) {
      // Reserve inventory
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            inventory: {
              decrement: item.quantity
            }
          }
        });
      }
    } else if (order.status === OrderStatus.PROCESSING && newStatus === OrderStatus.CANCELLED) {
      // Release reserved inventory
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            inventory: {
              increment: item.quantity
            }
          }
        });
      }
    }
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

  private async handleStatusSpecificActions(order: Order & { items: OrderItem[] }): Promise<void> {
    // Update inventory based on status change
    if (order.status === OrderStatus.PROCESSING) {
      // Decrease inventory
      for (const item of order.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });
        if (product) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { inventory: product.inventory - item.quantity }
          });
        }
      }
    } else if (order.status === OrderStatus.CANCELLED) {
      // Restore inventory
      for (const item of order.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });
        if (product) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { inventory: product.inventory + item.quantity }
          });
        }
      }
    }
  }
} 