# Redis Setup and Configuration Guide
Last Updated: 2025-01-21 20:34

## Overview
This guide covers Redis setup, configuration, and troubleshooting for the Bulk Buyer Group project.

## Prerequisites
- Docker Desktop
- PowerShell 7+
- Node.js v18+

## Installation Methods

### Method 1: Docker (Recommended)
1. Start Docker Desktop
2. Run Redis container:
   ```bash
   docker run --name redis-cache -p 6379:6379 -d redis
   ```typescript
3. Verify container is running:
   ```bash
   docker ps
   ```typescript
4. Get container IP:
   ```bash
   docker inspect redis-cache -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
   ```typescript
5. Configure environment variables in `.env`:
   ```typescript
   REDIS_HOST="<container-ip>"  # Replace with actual IP from step 4
   REDIS_PORT="6379"
   ```typescript

### Method 2: WSL (Alternative)
1. Install Redis in WSL:
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```typescript
2. Configure environment variables in `.env`:
   ```typescript
   REDIS_HOST="localhost"
   REDIS_PORT="6379"
   ```typescript

## Verification Steps

### 1. Test Redis Connection
For Docker:
```bash
docker exec redis-cache redis-cli ping  # Should return PONG
docker exec redis-cache redis-cli set test "Hello Redis"  # Test write
docker exec redis-cache redis-cli get test  # Test read
```typescript

For WSL:
```bash
redis-cli ping
redis-cli set test "Hello Redis"
redis-cli get test
```typescript

### 2. Cache Warming
```bash
npm run warm-cache
docker exec redis-cache redis-cli keys "*"  # Verify cached keys
```typescript

## Troubleshooting

### Common Issues

1. Redis Connection Refused
   - Verify Docker Desktop is running
   - Check container status: `docker ps`
   - Verify container IP in .env file
   - Try restarting container: `docker restart redis-cache`

2. Cache Warming Issues
   - Check Redis connection
   - Verify environment variables
   - Review error logs in `logs/error-*.log`
   - Run with debug: `$env:DEBUG="cache:*"; npm run warm-cache`

3. Database Issues
   - Verify PostgreSQL is running
   - Check database migrations: `npx prisma migrate status`
   - Reset if needed: `npx prisma migrate reset --force`

## Maintenance

### Regular Tasks
1. Monitor Redis memory usage:
   ```bash
   docker exec redis-cache redis-cli info memory
   ```typescript
2. Clear cache if needed:
   ```bash
   docker exec redis-cache redis-cli flushall
   ```typescript
3. Monitor container health:
   ```bash
   docker stats redis-cache
   ```typescript

### Container Management
```bash
# Stop Redis
docker stop redis-cache

# Start Redis
docker start redis-cache

# Remove container
docker rm redis-cache

# View logs
docker logs redis-cache
```typescript

## Integration with Project

### Cache Warming Script
Located in `frontend/src/scripts/warm-cache.ts`
- Runs on startup
- Caches frequently accessed data
- Updates periodically

### Redis Client
Located in `frontend/src/lib/redis.ts`
- Manages Redis connections
- Handles caching operations
- Implements retry logic

## Notes
- Docker is the recommended method for development
- Keep Redis memory usage under monitoring
- Regularly verify cache effectiveness
- Update cache warming strategy as needed 