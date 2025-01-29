import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('Starting database setup...');

    // Run migrations
    console.log('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    // Generate Prisma client
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Verify database connection
    console.log('Verifying database connection...');
    await prisma.$connect();
    console.log('Database connection successful');

    // Create indexes
    console.log('Creating database indexes...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON "Order" ("userId");
      CREATE INDEX IF NOT EXISTS idx_orders_status ON "Order" (status);
      CREATE INDEX IF NOT EXISTS idx_products_category ON "Product" (category);
    `;

    // Set up monitoring
    console.log('Setting up database monitoring...');
    await prisma.$executeRaw`
      CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
    `;

    // Configure connection pooling
    console.log('Configuring connection pooling...');
    await prisma.$executeRaw`
      ALTER SYSTEM SET max_connections = '200';
      ALTER SYSTEM SET shared_buffers = '1GB';
      ALTER SYSTEM SET effective_cache_size = '3GB';
    `;

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setupDatabase();
}

export { setupDatabase }; 