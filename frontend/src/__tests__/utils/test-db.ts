import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Create a mock PrismaClient
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Reset all mocks between tests
beforeEach(() => {
  mockReset(prismaMock);
});

// Export the mock client
export default prismaMock;

// Helper functions for common database operations in tests
export const dbHelpers = {
  // Clear all test data
  clearTestData: async (prisma: PrismaClient) => {
    const tablenames = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error) {
      console.log({ error });
    }
  },

  // Create test data
  createTestData: async (prisma: PrismaClient) => {
    // Add your test data creation logic here
    // Example:
    // await prisma.user.create({
    //   data: {
    //     email: 'test@example.com',
    //     name: 'Test User',
    //   },
    // });
  },
};

// Transaction helper for test isolation
export const withTestTransaction = async <T>(
  prisma: PrismaClient,
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const result = await callback(tx as unknown as PrismaClient);
      return result;
    });
  } catch (error) {
    throw error;
  }
};

// Test database configuration
export const testDbConfig = {
  // Add your test database configuration here
  // Example:
  // url: process.env.TEST_DATABASE_URL,
  // schema: 'test',
  // logging: false,
};

// Database setup and teardown helpers
export const setupTestDb = async () => {
  // Add your database setup logic here
  // Example:
  // const prisma = new PrismaClient(testDbConfig);
  // await prisma.$connect();
  // await dbHelpers.clearTestData(prisma);
  // await dbHelpers.createTestData(prisma);
  // return prisma;
};

export const teardownTestDb = async (prisma: PrismaClient) => {
  // Add your database teardown logic here
  // Example:
  // await dbHelpers.clearTestData(prisma);
  // await prisma.$disconnect();
}; 