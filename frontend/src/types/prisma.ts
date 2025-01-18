import { OrderStatus as PrismaOrderStatus, UserRole as PrismaUserRole } from '@prisma/client';

export type OrderStatus = PrismaOrderStatus;
export type UserRole = PrismaUserRole;

export const OrderStatusColors: Record<OrderStatus, string> = {
  POOLING: '#0010ff',
  PENDING: '#ff7300',
  PROCESSING: '#e65003',
  CONFIRMED: '#1c237e',
  SHIPPED: '#0010ff',
  DELIVERED: '#999999',
  CANCELLED: '#c3c3c3'
} as const;

export const OrderStatusLabels: Record<OrderStatus, string> = {
  POOLING: 'Pooling',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
} as const; 