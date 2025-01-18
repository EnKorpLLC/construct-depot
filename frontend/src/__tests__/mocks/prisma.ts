import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export const prisma = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prisma);
});

export type MockPrisma = DeepMockProxy<PrismaClient>; 