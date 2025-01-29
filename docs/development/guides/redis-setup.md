# Redis Setup

Last Updated: 2025-01-21 20:34

# Redis Setup Guide

## Overview

This guide covers Redis setup, configuration, and maintenance for the Construct Depot platform.

## Installation

### Docker Setup
```bash
# Pull Redis image
docker pull redis:7.2

# Run Redis container
docker run --name construct-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  -d redis:7.2 \
  redis-server --appendonly yes
```typescript

### Direct Installation

#### Windows
```powershell
# Using Chocolatey
choco install redis-64

# Start Redis service
Start-Service redis
```typescript

#### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server
```typescript

## Configuration

### Basic Settings
```conf
# Redis configuration
port 6379
bind 127.0.0.1
maxmemory 2gb
maxmemory-policy allkeys-lru
appendonly yes
```typescript

### Security
```conf
# Enable authentication
requirepass your_strong_password

# TLS configuration
tls-port 6380
tls-cert-file /path/to/cert.pem
tls-key-file /path/to/key.pem
tls-ca-file /path/to/ca.pem
```typescript

## Error Handling

### Common Issues

1. **Connection Refused**
```bash
# Check Redis service
sudo systemctl status redis-server

# Check port
netstat -an | grep 6379

# Test connection
redis-cli ping
```typescript

2. **Memory Issues**
```bash
# Check memory usage
redis-cli info memory

# Monitor memory
redis-cli monitor
```typescript

3. **Persistence Errors**
```bash
# Check AOF status
redis-cli info persistence

# Repair AOF file
redis-check-aof --fix appendonly.aof
```typescript

## Monitoring

### Health Checks
```typescript
const checkRedisHealth = async () => {
  try {
    await redis.ping();
    return { status: 'healthy' };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};
```typescript

### Performance Metrics
```typescript
const getRedisMetrics = async () => {
  const info = await redis.info();
  return {
    connectedClients: info.connected_clients,
    usedMemory: info.used_memory_human,
    totalKeys: await redis.dbsize(),
    commandsProcessed: info.total_commands_processed
  };
};
```typescript

## Best Practices

### 1. Memory Management
- Set appropriate maxmemory
- Choose correct eviction policy
- Monitor memory usage
- Regular cleanup

### 2. Persistence
- Enable AOF for durability
- Configure RDB snapshots
- Backup regularly
- Test recovery

### 3. Security
- Strong passwords
- Network security
- Access control
- SSL/TLS encryption

### 4. Performance
- Connection pooling
- Pipeline commands
- Monitor slow logs
- Optimize key patterns

## Resources
- [Redis Documentation](https://redis.io/docs)
- [Caching Guide](../../../../api/caching/README.md)
- [Monitoring Guide](../../../../monitoring/README.md) 