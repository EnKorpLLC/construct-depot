# WebSocket Testing Guide
Last Updated: 2025-01-21 20:34

## Overview
This guide covers testing WebSocket connections and real-time features in the Bulk Buyer Group application.

## Test Infrastructure

### 1. WebSocket Test Client
```typescript
import { WebSocket } from 'ws';
import { createTestClient } from '@/lib/test-utils';

describe('WebSocket Tests', () => {
  let ws: WebSocket;
  
  beforeEach(async () => {
    const client = await createTestClient();
    ws = new WebSocket('ws://localhost:3000/api/ws', {
      headers: { Authorization: `Bearer ${client.token}` }
    });
  });

  afterEach(() => {
    ws.close();
  });

  it('should connect successfully', (done) => {
    ws.on('open', () => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
      done();
    });
  });
});
```typescript

### 2. Message Testing
```typescript
it('should handle order updates', (done) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    expect(message).toHaveProperty('type', 'ORDER_UPDATE');
    expect(message).toHaveProperty('orderId');
    done();
  });

  // Trigger an order update
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_ORDER',
    orderId: 'test-order-id'
  }));
});
```typescript

## Test Types

### 1. Connection Tests
- Authentication
- Reconnection handling
- Error scenarios
- Connection limits

### 2. Message Tests
- Message format
- Payload validation
- Binary messages
- Large messages

### 3. Performance Tests
- Connection pooling
- Message throughput
- Memory usage
- CPU utilization

### 4. Integration Tests
- Redis pub/sub
- Database updates
- API interactions
- Client notifications

## Best Practices

### 1. Test Setup
- Use clean test database
- Mock external services
- Reset state between tests
- Clean up connections

### 2. Error Handling
- Test connection failures
- Test message failures
- Test timeout scenarios
- Test reconnection logic

### 3. Performance Testing
- Monitor memory usage
- Track message latency
- Test with many connections
- Test with large messages

## Example Tests

### 1. Connection Management
```typescript
describe('WebSocket Connection', () => {
  it('should reconnect on failure', async () => {
    const ws = new WebSocket('ws://localhost:3000/api/ws');
    
    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        ws.close();
        resolve();
      });
    });

    expect(ws.readyState).toBe(WebSocket.CLOSED);
  });

  it('should handle authentication', async () => {
    const ws = new WebSocket('ws://localhost:3000/api/ws', {
      headers: { Authorization: 'invalid-token' }
    });

    await new Promise<void>((resolve) => {
      ws.on('error', (error) => {
        expect(error.message).toContain('Unauthorized');
        resolve();
      });
    });
  });
});
```typescript

### 2. Message Handling
```typescript
describe('WebSocket Messages', () => {
  it('should handle binary messages', async () => {
    const ws = new WebSocket('ws://localhost:3000/api/ws');
    const buffer = Buffer.from('test message');

    await new Promise<void>((resolve) => {
      ws.on('message', (data) => {
        expect(data).toEqual(buffer);
        resolve();
      });

      ws.send(buffer);
    });
  });

  it('should validate message format', async () => {
    const ws = new WebSocket('ws://localhost:3000/api/ws');
    
    await new Promise<void>((resolve) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message).toHaveProperty('type');
        expect(message).toHaveProperty('payload');
        resolve();
      });

      ws.send(JSON.stringify({
        type: 'TEST',
        payload: { data: 'test' }
      }));
    });
  });
});
```typescript

## Troubleshooting

### Common Issues
1. Connection failures
   - Check server status
   - Verify authentication
   - Check network connectivity

2. Message failures
   - Validate message format
   - Check payload size
   - Verify connection state

3. Performance issues
   - Monitor memory usage
   - Check connection pool
   - Verify message queue

## Resources
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ws npm package](https://www.npmjs.com/package/ws)
- [Jest async testing](https://jestjs.io/docs/asynchronous) 