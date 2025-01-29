import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
  OrderStatus: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    POOLING: 'POOLING',
    CONFIRMED: 'CONFIRMED',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED'
  },
  UserRole: {
    ADMIN: 'ADMIN',
    CUSTOMER: 'CUSTOMER',
    SUPPLIER: 'SUPPLIER'
  },
  AdminActivityType: {
    ORDER_STATUS_CHANGE: 'ORDER_STATUS_CHANGE',
    INVENTORY_UPDATE: 'INVENTORY_UPDATE',
    USER_MANAGEMENT: 'USER_MANAGEMENT',
    SYSTEM_CONFIG: 'SYSTEM_CONFIG'
  }
})); 