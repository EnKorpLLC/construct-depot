# Testing Guide
Last Updated: 2024-01-19 12:45

## Overview
This guide covers all aspects of testing in the Bulk Buyer Group project, including automated verification tools and CI integration.

## Testing Stack
- Jest: Testing framework
- React Testing Library: Component testing
- Prisma Client: Database testing
- Supertest: API testing
- Cypress: E2E testing (planned)

## Automated Verification
The following checks run automatically in CI:
- Component structure verification
- Import path validation
- Test file naming conventions
- ESLint rules
- TypeScript type checking

## Test Types

### 1. Component Tests
Location: `src/components/__tests__/`

#### Naming Convention
- Test files must be in PascalCase
- Must match component name: `ComponentName.test.tsx`
- Must be in `__tests__` directory adjacent to component

#### Writing Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### 2. Unit Tests
Location: `src/__tests__/unit/`

#### Writing Unit Tests
```typescript
import { validateOrder } from '@/lib/validation';

describe('Order Validation', () => {
  it('should validate a valid order', () => {
    const order = {
      userId: '123',
      items: [{
        productId: '456',
        quantity: 5
      }]
    };
    expect(validateOrder(order)).toBe(true);
  });

  it('should reject invalid order', () => {
    const order = {
      userId: '123',
      items: []
    };
    expect(validateOrder(order)).toBe(false);
  });
});
```

### 3. Integration Tests
Location: `src/__tests__/integration/`

#### Writing Integration Tests
```typescript
import { createTestClient } from '@/lib/test-utils';
import { OrderService } from '@/lib/services';

describe('Order Service Integration', () => {
  let client;
  
  beforeEach(async () => {
    client = await createTestClient();
  });

  it('should create and process order', async () => {
    const order = await OrderService.createOrder(client, {
      items: [{ productId: '123', quantity: 1 }]
    });
    expect(order.status).toBe('processing');
  });
});
```

## Test Coverage Requirements
- Components: 90% coverage
- Business Logic: 95% coverage
- API Routes: 85% coverage
- Utils: 80% coverage

## Running Tests

### Development
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### CI Pipeline
Tests run automatically on:
- Pull requests
- Push to main branch
- Manual workflow dispatch

## Best Practices

### Component Testing
1. Test user interactions
2. Verify rendered output
3. Check accessibility
4. Test error states
5. Verify loading states

### Integration Testing
1. Use test database
2. Clean up after tests
3. Mock external services
4. Test error handling
5. Verify data persistence

### General Guidelines
1. Keep tests focused
2. Use meaningful descriptions
3. Follow AAA pattern (Arrange, Act, Assert)
4. Clean up test data
5. Avoid test interdependence

## Automated Checks

### Pre-commit Hooks
The following checks run before each commit:
```bash
npm run lint        # ESLint checks
npm run type-check  # TypeScript validation
npm test           # Run test suite
```

### CI Workflow
```yaml
- name: Run Tests
  run: |
    npm run test:ci
    npm run test:coverage
```

## Troubleshooting

### Common Issues
1. Test file naming
   - Use PascalCase
   - Place in __tests__ directory
   - Match component name

2. Component testing
   - Add 'use client' when needed
   - Mock hooks appropriately
   - Handle async operations

3. Integration tests
   - Use test database
   - Reset state between tests
   - Mock external services

## Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Component Testing Guide](guides/COMPONENT_CHECKLIST.md)

## Test Database Setup

### 1. Configuration
```env
# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/bulk_buyer_test_db"
```

### 2. Schema Setup
```bash
npx prisma db push --accept-data-loss
```

### 3. Seed Test Data
```typescript
// prisma/seed-test.ts
async function seedTestData() {
  await prisma.user.create({
    data: {
      id: 'test-user',
      email: 'test@example.com',
      // ... other fields
    }
  });
  // ... other test data
}
```

## Mock Data

### 1. Factory Functions
```typescript
// test/factories/order.ts
export function createOrderData(override = {}) {
  return {
    userId: 'test-user',
    status: 'PENDING',
    items: [{
      productId: 'test-product',
      quantity: 1
    }],
    ...override
  };
}
```

### 2. Mock Services
```typescript
// test/mocks/crawler-service.ts
export const mockCrawlerService = {
  crawl: jest.fn(),
  processResults: jest.fn(),
  handleError: jest.fn()
};
```

## Test Utilities

### 1. Authentication Helper
```typescript
// test/utils/auth.ts
export function authenticateUser(role = 'USER') {
  const token = generateTestToken({ role });
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}
```

### 2. Database Cleanup
```typescript
// test/utils/db.ts
export async function cleanupDatabase() {
  const tables = ['Order', 'User', 'Product'];
  for (const table of tables) {
    await prisma[table].deleteMany();
  }
}
```

## API Tests
Location: `src/__tests__/api/`

#### Writing API Tests
```typescript
import { createServer } from '@/lib/test-utils';
import supertest from 'supertest';

describe('Order API', () => {
  let app;
  let request;

  beforeAll(() => {
    app = createServer();
    request = supertest(app);
  });

  it('should create new order', async () => {
    const response = await request
      .post('/api/orders')
      .send({
        items: [{
          productId: 'test-product',
          quantity: 1
        }]
      })
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(201);
    expect(response.body.order).toBeDefined();
  });
}); 