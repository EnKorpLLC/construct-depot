import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    errorFormat: 'minimal',
  });

  return client.$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        const maxRetries = 3;
        let retries = 0;
        
        const runQuery = async () => {
          try {
            return await query(args);
          } catch (error: any) {
            if (error?.message?.includes('Connection') && retries < maxRetries) {
              retries++;
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 100));
              return runQuery();
            }
            throw error;
          }
        };
        
        return runQuery();
      }
    }
  });
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma as unknown as PrismaClient;
}

export { prisma }; 