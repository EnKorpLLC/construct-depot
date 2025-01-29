import { PrismaClient } from '@prisma/client';
import { 
  OrderStatus, 
  UserRole, 
  statusTransitionPermissions, 
  orderValidationSchema,
  ValidationMessages 
} from './types';

const prisma = new PrismaClient();

interface ValidationContext {
  userId: string;
  userRole: UserRole;
}

class OrderValidationService {
  // Validate order data structure
  static async validateOrderData(orderData: unknown) {
    try {
      return orderValidationSchema.parse(orderData);
    } catch (error) {
      throw new Error(ValidationMessages.INVALID_ORDER_DATA);
    }
  }

  // Validate status transition
  static async validateStatusTransition(
    orderId: string,
    newStatus: OrderStatus,
    context: ValidationContext
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check permission for status transition
    const allowedRoles = statusTransitionPermissions[newStatus];
    if (!allowedRoles.includes(context.userRole)) {
      throw new Error(ValidationMessages.INSUFFICIENT_PERMISSIONS);
    }

    // Validate status transition logic
    const isValidTransition = this.isValidStatusTransition(order.status as OrderStatus, newStatus);
    if (!isValidTransition) {
      throw new Error(ValidationMessages.INVALID_STATUS_TRANSITION);
    }

    // Additional validation based on status
    await this.validateStatusSpecificRules(order, newStatus);

    return true;
  }

  // Check if status transition is valid
  private static isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions = {
      [OrderStatus.DRAFT]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
      [OrderStatus.PENDING]: [OrderStatus.POOLING, OrderStatus.CANCELLED],
      [OrderStatus.POOLING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    return validTransitions[currentStatus].includes(newStatus);
  }

  // Validate status-specific business rules
  private static async validateStatusSpecificRules(order: any, newStatus: OrderStatus) {
    switch (newStatus) {
      case OrderStatus.POOLING:
        await this.validatePoolRequirements(order);
        break;
      case OrderStatus.CONFIRMED:
        await this.validateInventoryAvailability(order);
        break;
      // Add more status-specific validations as needed
    }
  }

  // Validate pool requirements
  private static async validatePoolRequirements(order: any) {
    const pooledOrder = await prisma.pooledOrder.findUnique({
      where: { id: order.pooledOrderId },
      include: { product: true }
    });

    if (!pooledOrder) {
      throw new Error(ValidationMessages.POOL_REQUIREMENTS_NOT_MET);
    }

    const totalQuantity = pooledOrder.currentQuantity + order.items[0].quantity;
    if (totalQuantity < pooledOrder.product.minOrderQuantity) {
      throw new Error(ValidationMessages.POOL_REQUIREMENTS_NOT_MET);
    }
  }

  // Validate inventory availability
  private static async validateInventoryAvailability(order: any) {
    const inventoryChecks = order.items.map(async (item: any) => {
      const inventory = await prisma.inventory.findUnique({
        where: { productId: item.productId }
      });

      if (!inventory || inventory.quantity < item.quantity) {
        throw new Error(ValidationMessages.INVENTORY_UNAVAILABLE);
      }
    });

    await Promise.all(inventoryChecks);
  }
}

export default OrderValidationService; 