# Troubleshooting

Last Updated: 2025-01-21 20:34

# Service Troubleshooting Guide

## Overview

This guide provides troubleshooting steps for common issues in the Construct Depot platform.

## Authentication Issues

### JWT Token Problems
```typescript
// Check token expiration
const isTokenExpired = (token: string) => {
  try {
    const decoded = jwt.decode(token);
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};
```typescript

### Common Auth Errors
1. **Invalid Token**
   - Check token format
   - Verify signature
   - Check expiration
   - Validate claims

2. **Missing Permissions**
   - Verify user roles
   - Check resource access
   - Validate scopes
   - Review audit logs

## Database Issues

### Connection Problems
```bash
# Check database status
sudo systemctl status postgresql

# Test connection
psql -U postgres -d constructdepot -c "SELECT 1"

# Check connection count
SELECT count(*) FROM pg_stat_activity;
```typescript

### Query Performance
```sql
-- Find slow queries
SELECT 
  pid,
  now() - query_start as duration,
  query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```typescript

## Redis Issues

### Cache Problems
```typescript
// Clear specific cache
await redis.del('cache:key');

// Clear pattern
const keys = await redis.keys('cache:prefix:*');
await Promise.all(keys.map(key => redis.del(key)));

// Monitor cache hits/misses
const metrics = await redis.info('stats');
console.log(metrics.keyspace_hits, metrics.keyspace_misses);
```typescript

### Memory Issues
```bash
# Check memory usage
redis-cli info memory

# Monitor real-time commands
redis-cli monitor

# Clear expired keys
redis-cli SCAN 0 COUNT 1000 TYPE string | xargs redis-cli EXPIRE 3600
```typescript

## API Performance

### Response Times
```typescript
const trackEndpointLatency = async (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.recordLatency(req.path, duration);
  });
  
  next();
};
```typescript

### Rate Limiting
```typescript
const checkRateLimit = async (key: string) => {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60);
  }
  return count <= 100;
};
```typescript

## WebSocket Issues

### Connection Problems
```typescript
class WSClient {
  private reconnectAttempts = 0;
  
  async connect() {
    try {
      this.ws = new WebSocket(WS_URL);
      this.setupListeners();
    } catch (error) {
      await this.handleReconnect();
    }
  }
  
  private async handleReconnect() {
    if (this.reconnectAttempts < 5) {
      this.reconnectAttempts++;
      await new Promise(r => setTimeout(r, 1000 * this.reconnectAttempts));
      await this.connect();
    }
  }
}
```typescript

### Message Handling
```typescript
// Debug message flow
ws.onmessage = (event) => {
  console.log('Received:', event.data);
  try {
    const data = JSON.parse(event.data);
    handleMessage(data);
  } catch (error) {
    console.error('Message parsing error:', error);
  }
};
```typescript

## Common Solutions

### 1. Service Recovery
```bash
# Restart services
sudo systemctl restart postgresql
sudo systemctl restart redis
pm2 restart all

# Clear temporary files
rm -rf /tmp/construct-*
```typescript

### 2. Data Recovery
```bash
# Backup current state
pg_dump constructdepot > backup.sql

# Restore from backup
psql constructdepot < backup.sql

# Check data integrity
SELECT count(*) FROM users;
SELECT count(*) FROM orders;
```typescript

### 3. Performance Recovery
```bash
# Clear Redis cache
redis-cli FLUSHDB

# Vacuum database
VACUUM ANALYZE;

# Reset connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'constructdepot';
```typescript

## Monitoring Tools

### 1. Log Analysis
```bash
# Check application logs
tail -f logs/app.log | grep ERROR

# Check system logs
journalctl -u postgresql
journalctl -u redis
```typescript

### 2. Performance Metrics
```typescript
const getSystemMetrics = async () => {
  return {
    cpu: await getCPUUsage(),
    memory: await getMemoryUsage(),
    disk: await getDiskUsage(),
    network: await getNetworkStats()
  };
};
```typescript

## Resources
- [Error Handling Guide](../error-handling/README.md)
- [Monitoring Guide](../../../../monitoring/README.md)
- [Database Guide](../../development/guides/../../development/guides/../../development/guides/database-setup.md)
- [Redis Guide](../../development/guides/../../development/guides/../../development/guides/redis-setup.md) 