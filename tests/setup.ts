import { setupTestEnvironment } from './test-env';

// Setup test environment
setupTestEnvironment();

// Global test timeout
jest.setTimeout(30000);

// Clean up resources after each test
afterEach(async () => {
  // Add any cleanup logic here
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

// Mock console.error and console.warn in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (process.env.DEBUG) {
      originalError.call(console, ...args);
    }
  };
  
  console.warn = (...args: any[]) => {
    if (process.env.DEBUG) {
      originalWarn.call(console, ...args);
    }
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Log test environment setup
console.log('Test environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL
}); 