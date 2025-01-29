import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that includes providers
function render(
  ui: React.ReactElement,
  {
    preloadedState = {},
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  } = {} as RenderOptions & { preloadedState?: any; queryClient?: QueryClient }
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Create a mock session
const createMockSession = (overrides = {}) => ({
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
});

// Create a mock theme context
const createMockThemeContext = (overrides = {}) => ({
  theme: 'light',
  toggleTheme: jest.fn(),
  ...overrides,
});

// Create a mock auth context
const createMockAuthContext = (overrides = {}) => ({
  user: null,
  loading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  ...overrides,
});

// Create a mock query client
const createMockQueryClient = (overrides = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        ...overrides,
      },
    },
  });
  return queryClient;
};

// Create a mock router
const createMockRouter = (overrides = {}) => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  query: {},
  pathname: '/',
  asPath: '/',
  ...overrides,
});

// Create a mock form context
const createMockFormContext = (overrides = {}) => ({
  register: jest.fn(),
  handleSubmit: jest.fn(),
  formState: {
    errors: {},
    isSubmitting: false,
    ...overrides.formState,
  },
  ...overrides,
});

// Create a mock intersection observer
const createMockIntersectionObserver = (overrides = {}) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  ...overrides,
});

// Create a mock resize observer
const createMockResizeObserver = (overrides = {}) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  ...overrides,
});

// Export everything
export {
  render,
  createMockSession,
  createMockThemeContext,
  createMockAuthContext,
  createMockQueryClient,
  createMockRouter,
  createMockFormContext,
  createMockIntersectionObserver,
  createMockResizeObserver,
}; 