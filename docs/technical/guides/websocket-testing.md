# WebSocket Testing Guide

## Overview
This guide provides comprehensive information about testing WebSocket connections and real-time notifications in the Bulk Buyer Group platform.

## Testing Infrastructure

### Required Tools
- Jest for unit and integration tests
- Playwright for E2E tests
- `ws` package for WebSocket server mocking
- `node-mocks-http` for HTTP request mocking

### Test Types

#### 1. Unit Tests
Test individual WebSocket-related functions and utilities:
```typescript
import { createWebSocket } from '@/lib/websocket';

describe('WebSocket Utilities', () => {
  it('should create WebSocket with correct config', () => {
    const ws = createWebSocket({
      endpoint: '/test',
      onMessage: jest.fn()
    });
    
    expect(ws).toBeDefined();
    expect(ws.url).toContain('/test');
  });
});
```

#### 2. Integration Tests
Test WebSocket server endpoints and message handling:
```typescript
import { createServer } from '@/lib/test-server';
import { WebSocket, Server } from 'ws';
import { NotificationService } from '@/lib/services/NotificationService';

describe('WebSocket Integration', () => {
  let wss: Server;
  let wsClient: WebSocket;

  beforeAll(async () => {
    const server = createServer();
    wss = new Server({ server });
    await new Promise(resolve => server.listen(0, resolve));
  });

  afterAll(() => {
    wss.close();
  });

  it('should handle real-time notifications', async () => {
    // Test implementation
  });
});
```

#### 3. E2E Tests
Test complete notification flows using Playwright:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Notification System', () => {
  test('should display real-time notifications', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Trigger notification
    await triggerNotification();
    
    // Verify notification appears
    await expect(page.getByTestId('notification-toast')).toBeVisible();
  });
});
```

## Test Scenarios

### Connection Management
1. Test successful connection
2. Test authentication
3. Test reconnection logic
4. Test connection error handling
5. Test concurrent connections

### Message Handling
1. Test different message types
2. Test message validation
3. Test message ordering
4. Test missed message recovery
5. Test offline message caching

### Error Scenarios
1. Test invalid messages
2. Test server errors
3. Test client errors
4. Test rate limiting
5. Test timeout handling

## Mocking

### Server Mocking
```typescript
import { Server } from 'ws';

function createMockServer() {
  const wss = new Server({ port: 0 });
  
  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      // Handle mock messages
    });
  });
  
  return wss;
}
```

### Client Mocking
```typescript
class MockWebSocket {
  constructor(url: string) {
    this.url = url;
  }
  
  send(data: string) {
    // Mock send
  }
  
  close() {
    // Mock close
  }
}

global.WebSocket = MockWebSocket;
```

## Best Practices

### Test Organization
1. Group related tests
2. Use descriptive test names
3. Maintain test independence
4. Clean up resources
5. Handle asynchronous operations

### Test Data
1. Use realistic test data
2. Reset state between tests
3. Avoid test data interference
4. Mock external services
5. Use consistent timestamps

### Assertions
1. Test connection status
2. Verify message content
3. Check error handling
4. Validate state changes
5. Confirm UI updates

## Example Test Suite

```typescript
import { test, expect } from '@playwright/test';
import { setupE2ETest, loginAsCustomer } from '../lib/e2e-utils';

test.describe('Notification Flows', () => {
  test.beforeEach(async ({ page }) => {
    await setupE2ETest();
    await loginAsCustomer(page);
  });

  test('should display notifications in panel', async ({ page }) => {
    await page.goto('/customer/dashboard');
    
    const panel = page.getByTestId('notification-panel');
    await expect(panel).toBeVisible();
    
    const count = page.getByTestId('notification-count');
    await expect(count).toBeVisible();
  });

  test('should mark notifications as read', async ({ page }) => {
    await page.goto('/customer/dashboard');
    
    const initialCount = await page.getByTestId('notification-count')
      .textContent();
    
    await page.getByRole('button', { name: 'Mark as read' })
      .first()
      .click();
    
    const newCount = await page.getByTestId('notification-count')
      .textContent();
      
    expect(Number(newCount)).toBeLessThan(Number(initialCount));
  });
});
```

## Troubleshooting

### Common Issues
1. Connection timeouts
2. Authentication failures
3. Message ordering issues
4. Race conditions
5. Resource cleanup

### Solutions
1. Increase timeout values
2. Verify authentication flow
3. Implement message sequencing
4. Add proper test isolation
5. Use afterEach/afterAll hooks

## CI/CD Integration

### GitHub Actions
```yaml
name: WebSocket Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run WebSocket tests
        run: npm run test:websocket
```

### Test Reports
1. Generate coverage reports
2. Track real-time test results
3. Monitor test performance
4. Alert on test failures
5. Archive test artifacts

## Performance Testing

### Metrics to Monitor
1. Connection time
2. Message latency
3. Reconnection time
4. Message throughput
5. Memory usage

### Load Testing
```typescript
import { Worker, Job } from 'worker_threads';

async function loadTest() {
  const CONNECTIONS = 1000;
  const workers = [];
  
  for (let i = 0; i < CONNECTIONS; i++) {
    const worker = new Worker('./websocket-worker.js');
    workers.push(worker);
  }
  
  // Monitor and collect metrics
}
```

## Security Testing

### Test Cases
1. Authentication bypass attempts
2. Invalid session handling
3. Rate limit enforcement
4. Message validation
5. Denial of service protection

## Monitoring and Debugging

### Tools
1. Browser DevTools
2. WebSocket inspection tools
3. Network analyzers
4. Log aggregators
5. Metrics dashboards

### Logging
```typescript
function setupLogging(ws: WebSocket) {
  ws.onmessage = (event) => {
    console.log('Received:', event.data);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}
```

## References
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Testing](https://playwright.dev/docs/intro)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ws Package Documentation](https://github.com/websockets/ws) 