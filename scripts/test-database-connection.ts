import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    // Test database connection by fetching the first user
    const user = await prisma.user.findFirst();
    if (user) {
      console.log('✅ Database connection successful:', user);
    } else {
      console.log('⚠️ Database connection successful, but no users found.');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection(); 