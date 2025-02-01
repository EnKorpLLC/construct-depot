import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

export type Context = {
  prisma: PrismaClient;
};

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
};

export const createMockContext = (): MockContext => {
  return {
    prisma: prismaMock,
  };
};

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
  Role: {
    super_admin: 'super_admin',
    GENERAL_CONTRACTOR: 'GENERAL_CONTRACTOR',
    SUBCONTRACTOR: 'SUBCONTRACTOR',
    user: 'user'
  },
  AdminActivityType: {
    ORDER_STATUS_CHANGE: 'ORDER_STATUS_CHANGE',
    INVENTORY_UPDATE: 'INVENTORY_UPDATE',
    USER_MANAGEMENT: 'USER_MANAGEMENT',
    SYSTEM_CONFIG: 'SYSTEM_CONFIG'
  }
})); 