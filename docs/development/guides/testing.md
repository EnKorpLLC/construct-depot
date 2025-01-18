# Testing Guide

## Overview
This guide covers all aspects of testing in the Bulk Buyer Group project.

## Testing Stack
- Jest: Testing framework
- React Testing Library: Component testing
- Prisma Client: Database testing
- Supertest: API testing
- Cypress: E2E testing (planned)

## Test Types

### 1. Unit Tests
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

### 2. Integration Tests
Location: `src/__tests__/integration/`

#### Writing Integration Tests
```typescript
import { createTestClient } from '@/lib/test-utils';
import { OrderService } from '@/lib/services';

describe('Order Service Integration', () => {
  let prisma;
  let orderService;

  beforeAll(async () => {
    prisma = createTestClient();
    orderService = new OrderService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create order and update inventory', async () => {
    const order = await orderService.createOrder({
      userId: 'test-user',
      items: [{
        productId: 'test-product',
        quantity: 1
      }]
    });

    const inventory = await prisma.product.findUnique({
      where: { id: 'test-product' }
    });

    expect(order.status).toBe('PENDING');
    expect(inventory.currentStock).toBe(previousStock - 1);
  });
});
```

### 3. Component Tests
Location: `src/__tests__/components/`

#### Writing Component Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderForm } from '@/components/OrderForm';

describe('OrderForm', () => {
  it('should submit order when form is valid', async () => {
    const onSubmit = jest.fn();
    render(<OrderForm onSubmit={onSubmit} />);

    await fireEvent.change(
      screen.getByLabelText('Quantity'),
      { target: { value: '5' } }
    );

    await fireEvent.click(screen.getByText('Submit Order'));

    expect(onSubmit).toHaveBeenCalledWith({
      quantity: 5
    });
  });
});
```

### 4. API Tests
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
```

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

## Running Tests

### 1. All Tests
```bash
npm test
```

### 2. Specific Tests
```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run component tests
npm run test:components

# Run with coverage
npm run test:coverage
```

### 3. Watch Mode
```bash
npm run test:watch
```

## Test Coverage Requirements

### Minimum Coverage Thresholds
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  }
};
```

## Continuous Integration

### GitHub Actions Configuration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
```

## Best Practices

1. Test Organization
   - One test file per module
   - Clear test descriptions
   - Proper test isolation

2. Naming Conventions
   - `*.test.ts` for unit tests
   - `*.spec.ts` for integration tests
   - `*.e2e.ts` for E2E tests

3. Test Structure
   - Arrange: Setup test data
   - Act: Execute the test
   - Assert: Verify the results

4. Mocking Guidelines
   - Mock external services
   - Use real implementations for core logic
   - Clear mock cleanup

5. Database Testing
   - Use transactions for isolation
   - Clean up after tests
   - Use separate test database 