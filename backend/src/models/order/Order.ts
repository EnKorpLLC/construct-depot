import { User } from '../user/User';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  POOLING = 'POOLING',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  metadata?: Record<string, any>;
}

export interface Order {
  id: string;
  userId: string;
  user?: User;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  metadata?: Record<string, any>;
}

export interface CreateOrderDTO {
  userId: string;
  items: Omit<OrderItem, 'id'>[];
  metadata?: Record<string, any>;
}

export interface UpdateOrderDTO {
  status?: OrderStatus;
  items?: Omit<OrderItem, 'id'>[];
  metadata?: Record<string, any>;
} 