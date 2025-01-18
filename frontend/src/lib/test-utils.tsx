import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

// Create a custom render function that includes providers
function render(ui: React.ReactElement, { session = null, ...renderOptions } = {}) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </SessionProvider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock session data
export const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'ADMIN',
  },
  expires: new Date(Date.now() + 2 * 86400).toISOString(),
};

// Mock order data
export const mockOrder = {
  id: 'test-order-id',
  status: 'PENDING',
  userId: 'test-user-id',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [
    {
      id: 'test-item-id',
      productId: 'test-product-id',
      quantity: 1,
      price: 100,
    },
  ],
};

// Mock product data
export const mockProduct = {
  id: 'test-product-id',
  name: 'Test Product',
  description: 'Test Description',
  price: 100,
  currentStock: 10,
  minOrderQuantity: 1,
};

// Mock API response
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
};

// Mock error response
export const mockErrorResponse = (status = 400, message = 'Bad Request') => {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
  });
};

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Create a mock event
export const createMockEvent = (type: string, data = {}) => {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: {
      value: '',
      ...data,
    },
    type,
  };
};

export * from '@testing-library/react';
export { render }; 