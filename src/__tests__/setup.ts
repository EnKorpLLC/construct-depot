import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { configure } from '@testing-library/react';

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
});

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