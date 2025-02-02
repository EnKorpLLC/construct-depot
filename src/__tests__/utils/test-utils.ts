import { Role } from '@prisma/client';
import { Session } from 'next-auth';
import { jest } from '@jest/globals';

export interface MockUser {
  id: string;
  role: Role;
}

export interface MockSession extends Session {
  user: MockUser;
}

export const createMockSession = (user: Partial<MockUser> = {}): MockSession => ({
  user: {
    id: 'test-user-id',
    role: Role.user,
    ...user
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
});

export const mockGetServerSession = (session: MockSession | null = null) => {
  return jest.fn().mockResolvedValue(session);
};

export const mockPrismaCreate = <T>(data: T) => {
  return jest.fn().mockResolvedValue(data);
};

export const mockPrismaFindUnique = <T>(data: T | null) => {
  return jest.fn().mockResolvedValue(data);
};

export const mockPrismaFindMany = <T>(data: T[]) => {
  return jest.fn().mockResolvedValue(data);
};

export const mockPrismaUpdate = <T>(data: T) => {
  return jest.fn().mockResolvedValue(data);
};

export const mockPrismaDelete = <T>(data: T) => {
  return jest.fn().mockResolvedValue(data);
};

export const mockRedis = {
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  setex: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  quit: jest.fn().mockResolvedValue('OK')
};

export type K6Response = {
  status: number;
  timings: {
    duration: number;
  };
};

export const createK6Response = (status: number, duration: number): K6Response => ({
  status,
  timings: { duration }
});

export const mockFetch = (response: any) => {
  (global.fetch as jest.Mock).mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
    })
  )
}

export const mockFetchError = (message: string, status = 400) => {
  (global.fetch as jest.Mock).mockImplementationOnce(() =>
    Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({ message }),
    })
  )
}

export const generateApiResponse = <T>(data: T) => ({
  success: true,
  data,
})

export const generateUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: Role.user,
  ...overrides,
})

export const generateValidationError = (message: string) => ({
  success: false,
  error: {
    message,
    code: 'VALIDATION_ERROR',
  },
})

export const generateOrder = (overrides = {}) => ({
  id: 'test-order-id',
  userId: 'test-user-id',
  status: 'PENDING',
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const generateProduct = (overrides = {}) => ({
  id: 'test-product-id',
  name: 'Test Product',
  description: 'Test Description',
  price: 100,
  stock: 10,
  ...overrides,
}) 