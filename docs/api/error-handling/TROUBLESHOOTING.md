# Troubleshooting Guide
Last Updated: 2025-01-21 20:34

## Overview

This document provides information about TROUBLESHOOTING.


## Common Issues and Solutions

### Redis Connection Issues

#### Issue: Redis Connection Refused
```typescript
Error: Redis connection error: connect ECONNREFUSED 127.0.0.1:6379
```typescript

**Solutions:**
1. Verify Docker container:
   ```bash
   docker ps | grep redis-cache
   ```typescript
2. Check container IP:
   ```bash
   docker inspect redis-cache -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
   ```typescript
3. Update `.env` with correct IP:
   ```env
   REDIS_HOST="<container-ip>"
   REDIS_PORT="6379"
   ```typescript

#### Issue: Redis CLI Not Accessible
**Solutions:**
1. Add PowerShell alias:
   ```powershell
   function redis-cli { wsl redis-cli $args }
   Set-Alias redis redis-cli
   ```typescript
2. Reload profile:
   ```powershell
   . $PROFILE
   ```typescript

### Database Issues

#### Issue: OrderSettings Table Not Found
```typescript
Error: Table "public.OrderSettings" does not exist
```typescript

**Solutions:**
1. Check migrations:
   ```bash
   npx prisma migrate status
   ```typescript
2. Reset database:
   ```bash
   npx prisma migrate reset --force
   ```typescript
3. Push schema:
   ```bash
   npx prisma db push
   ```typescript

#### Issue: Prisma Client Not Generated
**Solutions:**
1. Generate client:
   ```bash
   npx prisma generate
   ```typescript
2. Clear node_modules:
   ```bash
   rm -rf node_modules
   npm install
   ```typescript

### Component Issues

#### Issue: Component Structure Verification Failed
**Solutions:**
1. Check naming:
   ```bash
   npx ts-node scripts/verify-component-names.ts
   ```typescript
2. Fix imports:
   ```bash
   npx ts-node scripts/fix-imports.ts
   ```typescript

#### Issue: Test File Naming Issues
**Solutions:**
1. Verify test names:
   ```bash
   npx ts-node scripts/fix-test-names.ts --check
   ```typescript
2. Fix test names:
   ```bash
   npx ts-node scripts/fix-test-names.ts
   ```typescript

### Cache Warming Issues

#### Issue: Cache Not Warming
**Solutions:**
1. Check Redis connection:
   ```bash
   redis-cli ping
   ```typescript
2. Verify cache keys:
   ```bash
   redis-cli keys "*"
   ```typescript
3. Run with debug:
   ```bash
   $env:DEBUG="cache:*"; npm run warm-cache
   ```typescript

### Build Issues

#### Issue: Type Errors
**Solutions:**
1. Run type check:
   ```bash
   npm run type-check
   ```typescript
2. Update dependencies:
   ```bash
   npm update
   ```typescript
3. Clear TypeScript cache:
   ```bash
   rm -rf .next
   npm run build
   ```typescript

#### Issue: ESLint Errors
**Solutions:**
1. Fix automatically:
   ```bash
   npm run lint:fix
   ```typescript
2. Check specific file:
   ```bash
   npx eslint src/components/YourComponent.tsx
   ```typescript

## Monitoring and Debugging

### Application Logs
- Error logs: `logs/error-*.log`
- Exception logs: `logs/exceptions-*.log`
- Debug logs: `logs/debug-*.log`

### Redis Monitoring
```bash
# Monitor commands
redis-cli monitor

# Check memory
redis-cli info memory

# Check client list
redis-cli client list
```typescript

### Database Monitoring
```bash
# Check connections
SELECT * FROM pg_stat_activity;

# Check table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```typescript

## Performance Issues

### Slow API Responses
1. Check Redis cache hits
2. Monitor database queries
3. Review WebSocket connections
4. Check memory usage

### High Memory Usage
1. Monitor Redis memory
2. Check Node.js heap
3. Review database connections
4. Clear unnecessary caches

## Getting Help
1. Check documentation in `/docs`
2. Review error logs
3. Search issue tracker
4. Contact development team 