import { config } from 'dotenv';
import { join } from 'path';

export const setupTestEnvironment = () => {
  // Load test environment variables
  const result = config({ path: join(__dirname, '..', '.env.test') });

  if (result.error) {
    console.error('Error loading test environment variables:', result.error);
    process.exit(1);
  }

  // Define test environment
  const testEnv = {
    NODE_ENV: 'test',
    PORT: '3001',
    DATABASE_URL: 'postgresql://test_user:test_password@localhost:5432/bulkbuyer_test',
    ...process.env
  };

  // Apply environment variables
  Object.entries(testEnv).forEach(([key, value]) => {
    if (value !== undefined) {
      process.env[key] = value;
    }
  });

  return testEnv;
};

export const getTestEnv = () => ({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL
}); 