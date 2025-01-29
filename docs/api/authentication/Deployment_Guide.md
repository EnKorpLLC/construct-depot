# Deployment Guide

Last Updated: 2025-01-21 20:34

# Production Deployment Guide

## Overview

This document provides information about Deployment_Guide.


## Prerequisites
- Node.js v18 or higher
- PostgreSQL 14 or higher
- Redis 6.2 or higher
- Docker and Docker Compose
- Kubernetes cluster (for production deployment)
- SSL certificates
- Domain names configured

## Environment Setup

### 1. Infrastructure Requirements
```yaml
# Infrastructure specifications
CPU: 4 cores minimum per service
Memory: 16GB RAM minimum
Storage: 100GB SSD minimum
Network: 1Gbps minimum
```typescript

### 2. Environment Variables
```bash
# Core
NODE_ENV=production
API_URL=https://api.bulkbuyergroup.com
FRONTEND_URL=https://bulkbuyergroup.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://host:6379

# Security
JWT_SECRET=your-secure-jwt-secret
COOKIE_SECRET=your-secure-cookie-secret
ENCRYPTION_KEY=your-secure-encryption-key

# Services
CRAWLER_SERVICE_URL=http://crawler-service:3001
ANALYTICS_SERVICE_URL=http://analytics-service:3002
WEBSOCKET_URL=wss://ws.bulkbuyergroup.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-api-key
```typescript

### 3. Database Setup
```sql
-- Create production database
CREATE DATABASE bulkbuyer_prod;

-- Create read replica
CREATE DATABASE bulkbuyer_replica;

-- Setup user with limited permissions
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
```typescript

## Deployment Steps

### 1. Backend Services

#### API Service
```bash
# Build Docker image
docker build -t bulkbuyer-api:latest .

# Deploy to Kubernetes
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
```typescript

#### Analytics Service
```bash
# Build Docker image
docker build -t bulkbuyer-analytics:latest -f Dockerfile.analytics .

# Deploy to Kubernetes
kubectl apply -f k8s/analytics-deployment.yaml
kubectl apply -f k8s/analytics-service.yaml
```typescript

#### WebSocket Service
```bash
# Build Docker image
docker build -t bulkbuyer-ws:latest -f Dockerfile.websocket .

# Deploy to Kubernetes
kubectl apply -f k8s/websocket-deployment.yaml
kubectl apply -f k8s/websocket-service.yaml
```typescript

### 2. Frontend Deployment
```bash
# Build production assets
npm run build

# Deploy to CDN
aws s3 sync ./dist s3://bulkbuyer-frontend
aws cloudfront create-invalidation --distribution-id DISTID --paths "/*"
```typescript

### 3. Database Migration
```bash
# Run migrations
npx prisma migrate deploy

# Verify migrations
npx prisma migrate status
```typescript

## Scaling Configuration

### 1. Horizontal Pod Autoscaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-deployment
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```typescript

### 2. Database Connection Pooling
```typescript
// Database connection pool configuration
const pool = {
  min: 5,
  max: 20,
  idle: 10000,
  acquire: 30000,
};
```typescript

## Health Checks

### 1. Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
```typescript

### 2. Readiness Probe
```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```typescript

## Rollback Procedures

### 1. Application Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/api-deployment

# Verify rollback
kubectl rollout status deployment/api-deployment
```typescript

### 2. Database Rollback
```bash
# Rollback last migration
npx prisma migrate reset --skip-seed

# Restore from backup if needed
pg_restore -d bulkbuyer_prod latest_backup.dump
```typescript

## Verification Steps

### 1. System Health
- [ ] All services running and healthy
- [ ] Database connections established
- [ ] Redis connections established
- [ ] WebSocket connections working
- [ ] Metrics being reported
- [ ] Logs being collected

### 2. Application Health
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] Real-time updates functioning
- [ ] Analytics processing working
- [ ] Background jobs running

### 3. Performance Verification
- [ ] Response times within thresholds
- [ ] CPU usage normal
- [ ] Memory usage normal
- [ ] Database query performance good
- [ ] Cache hit rates acceptable

## Security Measures

### 1. Network Security
- [ ] SSL/TLS configured
- [ ] API endpoints protected
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] WAF rules set up

### 2. Application Security
- [ ] Input validation
- [ ] XSS protection
- [ ] CSRF protection
- [ ] SQL injection protection
- [ ] Authentication tokens secure

## Post-Deployment Tasks

### 1. Monitoring Setup
- [ ] Set up Datadog dashboards
- [ ] Configure Sentry error tracking
- [ ] Set up performance monitoring
- [ ] Configure alert thresholds
- [ ] Set up log aggregation

### 2. Backup Configuration
- [ ] Database backup schedule
- [ ] File storage backup
- [ ] Configuration backup
- [ ] Backup restoration tested
- [ ] Backup retention policy set 