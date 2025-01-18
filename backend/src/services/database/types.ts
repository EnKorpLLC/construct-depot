import { Order, OrderItem } from '@prisma/client';

export interface DatabaseOrder extends Order {
  items: DatabaseOrderItem[];
  user?: DatabaseUser;
}

export interface DatabaseOrderItem extends OrderItem {
  product?: DatabaseProduct;
}

export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderData {
  userId: string;
  items: Omit<OrderItem, 'id' | 'orderId'>[];
  metadata?: Record<string, any>;
}

export interface UpdateOrderData {
  items?: Omit<OrderItem, 'id' | 'orderId'>[];
  status?: Order['status'];
  metadata?: Record<string, any>;
  completedAt?: Date;
  cancelledAt?: Date;
}

export interface OrderFilters {
  userId?: string;
  status?: Order['status'];
} 