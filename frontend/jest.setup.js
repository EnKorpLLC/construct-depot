// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch
global.fetch = jest.fn();

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_API_URL: 'http://localhost:3000',
  SMTP_USER: 'test@example.com',
  SMTP_PASS: 'test-password',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch.mockClear();
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
}); 