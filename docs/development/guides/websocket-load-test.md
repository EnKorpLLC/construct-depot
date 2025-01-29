# WebSocket Load Testing Guide

Last Updated: 2025-01-21 20:34

## Overview
This guide details the WebSocket load testing configuration and procedures for the Bulk Buyer Group platform's real-time features.

## Test Configuration
```typescript
// Location: frontend/src/tests/load/websocket-test.ts
interface TestMetrics {
  connections: number;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  latencies: number[];
}

// Success Criteria
const criteria = {
  successRate: 95,     // >95% success rate
  avgLatency: 100,     // <100ms average
  p95Latency: 500      // <500ms for 95th percentile
};

// Test Parameters
const testConfig = {
  totalConnections: 1000,  // Total number of connections
  workerCount: 4,         // Number of worker threads
  testDuration: 5 * 60 * 1000  // 5 minutes
};
```typescript

## Test Scenarios
1. Connection Management
   - Concurrent connection handling (1000 connections)
   - Connection stability under load
   - Reconnection behavior
   - Connection pool management across 4 workers

2. Message Broadcasting
   - Ping/Pong latency testing
   - Message delivery verification
   - Connection stability monitoring
   - Worker thread coordination

3. Performance Metrics
   - Connection success rate
   - Message latency tracking
   - Error rate monitoring
   - Worker thread performance

## Running Tests
```bash
# Run WebSocket load test
npm run test:load:ws

# Test is configured to:
# - Create 1000 connections
# - Distribute across 4 workers
# - Run for 5 minutes
# - Report metrics every second
```typescript

## Success Criteria
1. Connection Performance
   - 95% of connections established within 1 second
   - Maximum concurrent connections: 1000
   - Connection error rate below 1%

2. Message Performance
   - Message delivery latency < 200ms for 95% of messages
   - Message loss rate < 0.1%
   - Broadcast latency < 500ms for 1000 recipients

3. System Stability
   - No memory leaks
   - CPU usage below 70%
   - No connection pool exhaustion

## Monitoring
1. Real-time Metrics
   - Active connections
   - Message throughput
   - Error rates
   - Resource usage

2. Test Reports
   - Connection statistics
   - Latency distributions
   - Error logs
   - Resource utilization graphs

## Common Issues
1. Connection Pool Exhaustion
   - Symptom: Connection failures under load
   - Solution: Adjust pool size and timeout settings

2. High Latency
   - Symptom: Message delivery delays
   - Solution: Check message queue and processing logic

3. Memory Leaks
   - Symptom: Increasing memory usage
   - Solution: Review connection cleanup and message handling

## Integration Points
1. Redis Pub/Sub
   - Message queue performance
   - Channel subscription handling
   - Message persistence

2. Database Impact
   - Connection pool usage
   - Query performance under load
   - Transaction handling

## Notes
- Always run tests in isolation
- Monitor system resources
- Check Redis performance
- Review error logs
- Document any anomalies 