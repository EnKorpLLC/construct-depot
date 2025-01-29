import { OrderStatus, UserRole } from '@prisma/client';
import { theme } from '@/lib/theme';

interface ValidationError {
  message: string;
  code: string;
  field?: string;
}

interface ValidationContext {
  userId: string;
  userRole: UserRole;
  orderId: string;
  currentStatus: OrderStatus;
  targetStatus: OrderStatus;
  metadata?: Record<string, any>;
}

export class ValidationService {
  private static readonly VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    POOLING: ['PENDING', 'CANCELLED'],
    PENDING: ['POOLING', 'PROCESSING', 'CANCELLED'],
    PROCESSING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  private static readonly ROLE_PERMISSIONS: Record<UserRole, OrderStatus[]> = {
    ADMIN: ['POOLING', 'PENDING', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    SUPPLIER: ['PROCESSING', 'CONFIRMED', 'SHIPPED'],
    CUSTOMER: ['CANCELLED'],
    GENERAL_CONTRACTOR: ['CANCELLED'],
    SUBCONTRACTOR: ['CANCELLED'],
  };

  private static readonly STATUS_RULES: Record<OrderStatus, (context: ValidationContext) => Promise<ValidationError | null>> = {
    POOLING: async (context) => {
      // Check if order meets pooling criteria
      const { metadata } = context;
      if (!metadata?.currentQuantity || !metadata?.targetQuantity) {
        return {
          message: 'Missing quantity information for pooling',
          code: 'INVALID_POOLING_DATA',
        };
      }
      return null;
    },
    PENDING: async (context) => {
      // Verify order has all required information
      const { metadata } = context;
      if (!metadata?.shippingAddress) {
        return {
          message: 'Shipping address is required',
          code: 'MISSING_SHIPPING_ADDRESS',
        };
      }
      return null;
    },
    PROCESSING: async (context) => {
      // Check inventory availability
      const { metadata } = context;
      if (!metadata?.inventoryAvailable) {
        return {
          message: 'Insufficient inventory',
          code: 'INSUFFICIENT_INVENTORY',
        };
      }
      return null;
    },
    CONFIRMED: async () => null,
    SHIPPED: async (context) => {
      // Verify shipping information
      const { metadata } = context;
      if (!metadata?.trackingNumber) {
        return {
          message: 'Tracking number is required',
          code: 'MISSING_TRACKING_NUMBER',
        };
      }
      return null;
    },
    DELIVERED: async () => null,
    CANCELLED: async () => null,
  };

  static async validateTransition(context: ValidationContext): Promise<ValidationError | null> {
    // 1. Check if the transition is valid
    if (!this.VALID_TRANSITIONS[context.currentStatus].includes(context.targetStatus)) {
      return {
        message: `Invalid transition from ${context.currentStatus} to ${context.targetStatus}`,
        code: 'INVALID_TRANSITION',
      };
    }

    // 2. Check if user has permission
    if (!this.ROLE_PERMISSIONS[context.userRole].includes(context.targetStatus)) {
      return {
        message: `User role ${context.userRole} cannot transition to ${context.targetStatus}`,
        code: 'INSUFFICIENT_PERMISSIONS',
      };
    }

    // 3. Apply status-specific rules
    const ruleCheck = await this.STATUS_RULES[context.targetStatus](context);
    if (ruleCheck) {
      return ruleCheck;
    }

    return null;
  }

  static getStatusColor(status: OrderStatus): string {
    return theme.statusColors[status] || theme.colors.greyDarker;
  }

  static getAvailableTransitions(currentStatus: OrderStatus, userRole: UserRole): OrderStatus[] {
    return this.VALID_TRANSITIONS[currentStatus].filter(status => 
      this.ROLE_PERMISSIONS[userRole].includes(status)
    );
  }
} 