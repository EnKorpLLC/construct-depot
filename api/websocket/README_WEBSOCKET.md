# Websocket

Last Updated: 2025-01-21 20:34

# WebSocket API Documentation

## Overview
This document describes the WebSocket API for real-time notifications in the Bulk Buyer Group platform.

## Connection

### Endpoint
```typescript
ws://[host]/api/notifications/ws
```typescript

### Authentication
WebSocket connections require authentication using the same session as the REST API. The connection will be rejected if no valid session is found.

## Message Format

### Server to Client Messages
```typescript
interface WebSocketMessage {
  type: 'ORDER_STATUS_CHANGE' | 'POOL_PROGRESS' | 'SYSTEM_NOTIFICATION';
  id: string;
  timestamp: string;
  data: {
    // Message-specific data
  };
}
```typescript

### Message Types

#### Order Status Change
```typescript
{
  type: 'ORDER_STATUS_CHANGE',
  id: 'notification-id',
  timestamp: '2025-01-11T16:15:00Z',
  data: {
    orderId: 'order-id',
    fromStatus: 'PENDING',
    toStatus: 'PROCESSING'
  }
}
```typescript

#### Pool Progress
```typescript
{
  type: 'POOL_PROGRESS',
  id: 'notification-id',
  timestamp: '2025-01-11T16:15:00Z',
  data: {
    poolId: 'pool-id',
    progress: 75,
    currentQuantity: 150,
    targetQuantity: 200
  }
}
```typescript

#### System Notification
```typescript
{
  type: 'SYSTEM_NOTIFICATION',
  id: 'notification-id',
  timestamp: '2025-01-11T16:15:00Z',
  data: {
    title: 'Maintenance Scheduled',
    message: 'System maintenance scheduled for...',
    severity: 'INFO' | 'WARNING' | 'ERROR'
  }
}
```typescript

## Connection Management

### Reconnection
The client should implement reconnection logic with exponential backoff:
```typescript
const INITIAL_DELAY = 1000; // 1 second
const MAX_DELAY = 30000;    // 30 seconds
const BACKOFF_FACTOR = 1.5;

let retryDelay = INITIAL_DELAY;

function connect() {
  const ws = new WebSocket(WS_URL);
  
  ws.onclose = () => {
    setTimeout(() => {
      retryDelay = Math.min(retryDelay * BACKOFF_FACTOR, MAX_DELAY);
      connect();
    }, retryDelay);
  };

  ws.onopen = () => {
    retryDelay = INITIAL_DELAY; // Reset delay on successful connection
  };
}
```typescript

### Missed Notifications
When reconnecting, the client should fetch missed notifications using the REST API:
```typescript
GET /api/notifications?since={last_received_timestamp}
```typescript

## Error Handling

### Connection Errors
- 1000: Normal closure
- 1001: Going away (server shutdown)
- 1011: Internal server error
- 4000: Authentication required
- 4001: Invalid session
- 4002: Rate limit exceeded

### Best Practices
1. Implement heartbeat mechanism
2. Handle reconnection gracefully
3. Maintain message order using timestamps
4. Cache messages locally when offline
5. Implement progressive backoff for reconnection attempts

## Examples

### Connecting to WebSocket
```typescript
import { createWebSocket } from '@/lib/websocket';

const ws = createWebSocket({
  endpoint: '/api/notifications/ws',
  onMessage: (message) => {
    console.log('Received:', message);
  },
  onError: (error) => {
    console.error('WebSocket error:', error);
  },
  onClose: () => {
    console.log('Connection closed');
  }
});
```typescript

### Handling Different Message Types
```typescript
function handleMessage(message: WebSocketMessage) {
  switch (message.type) {
    case 'ORDER_STATUS_CHANGE':
      updateOrderStatus(message.data);
      break;
    case 'POOL_PROGRESS':
      updatePoolProgress(message.data);
      break;
    case 'SYSTEM_NOTIFICATION':
      showSystemNotification(message.data);
      break;
  }
}
```typescript

## Rate Limiting
- Maximum 100 connections per user
- Maximum 1000 messages per minute
- Connection throttling applies after limits exceeded

## Security Considerations
1. Always use WSS (WebSocket Secure) in production
2. Validate all incoming messages
3. Implement authentication timeout
4. Rate limit connections and messages
5. Sanitize message content

## Testing
Refer to the [WebSocket Testing Guide](../guides/websocket-testing.md) for detailed information about testing WebSocket connections and notifications. 