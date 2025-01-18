import { z } from 'zod';

// Order Status Enum
export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  POOLING = 'POOLING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

// Role-based permissions
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  ADMIN = 'ADMIN'
}

// Status transition permissions
export const statusTransitionPermissions = {
  [OrderStatus.DRAFT]: [UserRole.CUSTOMER],
  [OrderStatus.PENDING]: [UserRole.CUSTOMER],
  [OrderStatus.POOLING]: [UserRole.CUSTOMER, UserRole.SUPPLIER],
  [OrderStatus.CONFIRMED]: [UserRole.SUPPLIER],
  [OrderStatus.PROCESSING]: [UserRole.SUPPLIER],
  [OrderStatus.SHIPPED]: [UserRole.SUPPLIER],
  [OrderStatus.DELIVERED]: [UserRole.CUSTOMER, UserRole.SUPPLIER],
  [OrderStatus.CANCELLED]: [UserRole.CUSTOMER, UserRole.SUPPLIER, UserRole.ADMIN],
} as const;

// Validation Schemas
export const orderItemValidationSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

export const orderValidationSchema = z.object({
  items: z.array(orderItemValidationSchema),
  shippingAddress: z.string().min(1),
  shippingCity: z.string().min(1),
  shippingState: z.string().length(2),
  shippingZip: z.string().regex(/^\d{5}(-\d{4})?$/),
  shippingCountry: z.string().min(1),
  status: z.nativeEnum(OrderStatus),
});

// Custom validation error messages
export const ValidationMessages = {
  INVALID_STATUS_TRANSITION: 'Invalid order status transition',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this operation',
  INVALID_ORDER_DATA: 'Invalid order data provided',
  POOL_REQUIREMENTS_NOT_MET: 'Pool requirements not met for this order',
  INVENTORY_UNAVAILABLE: 'Insufficient inventory available',
} as const; 