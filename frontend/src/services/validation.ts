import { OrderStatus, ValidationContext, ValidationError, StatusTransitionValidators } from '@/types/order';

export class OrderValidationService {
  private static instance: OrderValidationService;
  private statusValidators: StatusTransitionValidators;

  private constructor() {
    this.statusValidators = {
      [OrderStatus.PENDING]: this.validatePendingTransition.bind(this),
      [OrderStatus.POOLING]: this.validatePoolingTransition.bind(this),
      [OrderStatus.PROCESSING]: this.validateProcessingTransition.bind(this),
      [OrderStatus.CONFIRMED]: this.validateConfirmedTransition.bind(this),
      [OrderStatus.PAID]: this.validatePaidTransition.bind(this),
      [OrderStatus.SHIPPING]: this.validateShippingTransition.bind(this),
      [OrderStatus.DELIVERED]: this.validateDeliveredTransition.bind(this),
      [OrderStatus.CANCELLED]: this.validateCancelledTransition.bind(this),
      [OrderStatus.REFUNDED]: this.validateRefundedTransition.bind(this),
    };
  }

  public static getInstance(): OrderValidationService {
    if (!OrderValidationService.instance) {
      OrderValidationService.instance = new OrderValidationService();
    }
    return OrderValidationService.instance;
  }

  public async validateTransition(context: ValidationContext): Promise<ValidationError | null> {
    const validator = this.statusValidators[context.currentStatus];
    if (!validator) {
      return {
        code: 'INVALID_STATUS',
        message: `Invalid current status: ${context.currentStatus}`,
      };
    }
    return validator(context);
  }

  private async validatePendingTransition(context: ValidationContext): Promise<ValidationError | null> {
    const allowedTransitions = [OrderStatus.POOLING, OrderStatus.PROCESSING, OrderStatus.CANCELLED];
    if (!allowedTransitions.includes(context.newStatus)) {
      return {
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${context.currentStatus} to ${context.newStatus}`,
      };
    }
    return null;
  }

  private async validatePoolingTransition(context: ValidationContext): Promise<ValidationError | null> {
    const allowedTransitions = [OrderStatus.PROCESSING, OrderStatus.CANCELLED];
    if (!allowedTransitions.includes(context.newStatus)) {
      return {
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${context.currentStatus} to ${context.newStatus}`,
      };
    }
    return null;
  }

  private async validateProcessingTransition(context: ValidationContext): Promise<ValidationError | null> {
    const allowedTransitions = [OrderStatus.CONFIRMED, OrderStatus.CANCELLED];
    if (!allowedTransitions.includes(context.newStatus)) {
      return {
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${context.currentStatus} to ${context.newStatus}`,
      };
    }
    return null;
  }

  private async validateConfirmedTransition(context: ValidationContext): Promise<ValidationError | null> {
    const allowedTransitions = [OrderStatus.PAID, OrderStatus.CANCELLED];
    if (!allowedTransitions.includes(context.newStatus)) {
      return {
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${context.currentStatus} to ${context.newStatus}`,
      };
    }
    return null;
  }

  private async validatePaidTransition(context: ValidationContext): Promise<ValidationError | null> {
    const allowedTransitions = [OrderStatus.SHIPPING, OrderStatus.REFUNDED];
    if (!allowedTransitions.includes(context.newStatus)) {
      return {
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${context.currentStatus} to ${context.newStatus}`,
      };
    }
    return null;
  }

  private async validateShippingTransition(context: ValidationContext): Promise<ValidationError | null> {
    const allowedTransitions = [OrderStatus.DELIVERED];
    if (!allowedTransitions.includes(context.newStatus)) {
      return {
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${context.currentStatus} to ${context.newStatus}`,
      };
    }
    return null;
  }

  private async validateDeliveredTransition(context: ValidationContext): Promise<ValidationError | null> {
    return {
      code: 'INVALID_TRANSITION',
      message: 'Cannot transition from DELIVERED status',
    };
  }

  private async validateCancelledTransition(context: ValidationContext): Promise<ValidationError | null> {
    return {
      code: 'INVALID_TRANSITION',
      message: 'Cannot transition from CANCELLED status',
    };
  }

  private async validateRefundedTransition(context: ValidationContext): Promise<ValidationError | null> {
    return {
      code: 'INVALID_TRANSITION',
      message: 'Cannot transition from REFUNDED status',
    };
  }
} 