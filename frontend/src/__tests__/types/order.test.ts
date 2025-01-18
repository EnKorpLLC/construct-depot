import { OrderStatus, ValidationContext, ValidationError } from '@/types/order';

describe('OrderStatus', () => {
  it('should have the correct status values', () => {
    expect(OrderStatus.DRAFT).toBe('DRAFT');
    expect(OrderStatus.PENDING).toBe('PENDING');
    expect(OrderStatus.POOLING).toBe('POOLING');
    expect(OrderStatus.PROCESSING).toBe('PROCESSING');
    expect(OrderStatus.COMPLETED).toBe('COMPLETED');
    expect(OrderStatus.CANCELLED).toBe('CANCELLED');
  });
});

describe('ValidationContext', () => {
  it('should create a valid validation context', () => {
    const context: ValidationContext = {
      errors: [],
      isValid: true,
    };
    expect(context.errors).toHaveLength(0);
    expect(context.isValid).toBe(true);
  });

  it('should create a validation context with errors', () => {
    const error: ValidationError = {
      field: 'status',
      message: 'Invalid status transition',
    };
    const context: ValidationContext = {
      errors: [error],
      isValid: false,
    };
    expect(context.errors).toHaveLength(1);
    expect(context.errors[0]).toEqual(error);
    expect(context.isValid).toBe(false);
  });
}); 