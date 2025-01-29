# Development

Last Updated: 2025-01-21 20:34

# Frontend Development Guide

## Overview

This guide covers development standards, best practices, and workflows for the Construct Depot frontend.

## Project Structure

```typescript
frontend/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions
├── styles/          # Global styles
├── public/          # Static assets
└── tests/           # Test files
```typescript

## Development Setup

### Environment Setup
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Start development server
npm run dev
```typescript

### IDE Configuration
```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```typescript

## Coding Standards

### TypeScript
```typescript
// Use interfaces for props
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

// Use function components
const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
};
```typescript

### Component Structure
```typescript
// Component template
import { useState, useEffect } from 'react';
import styles from './Component.module.css';

interface ComponentProps {
  // Props definition
}

export const Component: React.FC<ComponentProps> = (props) => {
  // State hooks
  const [state, setState] = useState(initial);
  
  // Effect hooks
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // Event handlers
  const handleEvent = () => {
    // Event logic
  };
  
  // Render
  return (
    <div className={styles.container}>
      {/* JSX */}
    </div>
  );
};
```typescript

## State Management

### React Context
```typescript
// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Use context
const { state, dispatch } = useContext(AppContext);
```typescript

### API Integration
```typescript
// API client setup
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API hooks
const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders');
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  return { orders, loading };
};
```typescript

## Testing

### Component Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button label="Click me" onClick={handleClick} />);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```typescript

### Integration Tests
```typescript
import { renderHook } from '@testing-library/react-hooks';

describe('useOrders', () => {
  it('fetches orders', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useOrders());
    
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.orders).toHaveLength(2);
    expect(result.current.loading).toBe(false);
  });
});
```typescript

## Performance

### Code Splitting
```typescript
// Dynamic imports
const DynamicComponent = dynamic(() => import('./DynamicComponent'), {
  loading: () => <Loading />,
  ssr: false
});

// Route-based code splitting
import dynamic from 'next/dynamic';

const OrdersPage = dynamic(() => import('./pages/orders'));
```typescript

### Optimization
```typescript
// Memoization
const MemoizedComponent = React.memo(Component);

// Callback optimization
const handleClick = useCallback(() => {
  // Event logic
}, [dependencies]);

// Value memoization
const computedValue = useMemo(() => {
  return expensiveComputation(deps);
}, [deps]);
```typescript

## Best Practices

### 1. Component Design
- Single responsibility
- Proper prop drilling
- Error boundaries
- Loading states

### 2. State Management
- Local vs global state
- Proper context usage
- State immutability
- Side effect handling

### 3. Performance
- Lazy loading
- Image optimization
- Bundle analysis
- Caching strategy

### 4. Testing
- Component testing
- Integration testing
- E2E testing
- Test coverage

## Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Testing Guide](../../development/guides/testing.md)
- [Component Guide](../../development/guides/components.md) 