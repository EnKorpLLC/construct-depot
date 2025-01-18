export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  POOLING = 'POOLING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER'
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface PooledOrder {
  id: string;
  supplierId: string;
  status: OrderStatus;
  orders: Order[];
  totalQuantity: number;
  threshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currentStock: number;
  supplierId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationContext {
  errors: ValidationError[];
  isValid: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface StockUpdateResult {
  success: boolean;
  newStock: number;
  message?: string;
}

export type StatusTransitionValidator = (context: ValidationContext) => Promise<ValidationError | null>;

export type StatusTransitionValidators = Record<OrderStatus, StatusTransitionValidator>;

export interface OrderData {
  userId: string;
  supplierId: string;
  items: OrderItem[];
}

export interface PoolData {
  productId: string;
  supplierId: string;
  minQuantity: number;
  pricePerUnit: number;
  expiryDate: Date;
} 