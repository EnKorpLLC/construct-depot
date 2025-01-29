import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { configure } from '@testing-library/react';
import { validateTestEnvironment } from './utils/dependencyChecker';
import path from 'path';

// Run dependency checks before any tests
beforeAll(async () => {
  try {
    await validateTestEnvironment(path.resolve(__dirname, '../../'));
  } catch (error) {
    console.error('❌ Test environment validation failed:', error);
    process.exit(1);
  }
});

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
});

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

// Clean up any side effects
afterAll(() => {
  jest.restoreAllMocks();
}); 