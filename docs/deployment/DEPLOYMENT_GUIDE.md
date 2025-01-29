# Deployment Guide

Last Updated: 2025-01-29

## Overview

This guide details the deployment process for the Construct Depot Bulk Buying Platform to app.constructdepot.com.

## Prerequisites

- Docker and Docker Compose installed
- SSL certificates for app.constructdepot.com
- Access to production environment variables
- Node.js 18+ and npm installed

## Environment Setup

1. Configure production environment variables:
```bash
# Database
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/constructdepot
POSTGRES_DB=constructdepot
POSTGRES_USER=postgres

# Redis
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# Domain Configuration
API_URL=https://api.constructdepot.com
WEBSOCKET_URL=wss://api.constructdepot.com
NEXT_PUBLIC_APP_URL=https://app.constructdepot.com
```

## Deployment Steps

1. Build the application:
```bash
npm run build
```

2. Start the production services:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. Run database migrations:
```bash
npm run setup:db
```

4. Configure Redis cluster:
```bash
npm run setup:redis
```

5. Set up monitoring:
```bash
npm run setup:monitoring
```

## Infrastructure Components

- **Nginx**: Reverse proxy and SSL termination
- **PostgreSQL**: Primary database
- **Redis Cluster**: Caching and session management
- **Datadog**: Monitoring and alerting

## Security Configuration

- SSL/TLS configuration with modern cipher suites
- HTTP/2 enabled
- Security headers configured
- Rate limiting implemented
- CORS policies set

## Monitoring Setup

- Health check endpoints configured
- Performance metrics tracking
- Error rate monitoring
- Resource utilization alerts

## Rollback Procedure

In case of deployment issues:

1. Trigger rollback:
```bash
npm run deploy:rollback
```

2. Verify system health:
```bash
npm run deploy:verify
```

## Post-Deployment Verification

1. Check application health:
```bash
npm run monitor:health
```

2. Verify all services:
```bash
npm run monitor:metrics
```

3. Run load tests:
```bash
npm run test:load
```

## Troubleshooting

Common issues and solutions:

1. Database Connection Issues:
   - Verify DATABASE_URL configuration
   - Check database container logs
   - Ensure migrations are up to date

2. Redis Connection Issues:
   - Verify REDIS_URL configuration
   - Check Redis cluster status
   - Verify network connectivity

3. SSL/TLS Issues:
   - Verify certificate paths
   - Check Nginx configuration
   - Validate SSL certificate expiry

## Contact

For deployment issues, contact:
- DevOps Team: devops@constructdepot.com
- Security Team: security@constructdepot.com 