# Deployment

Last Updated: 2025-01-21 20:34

# Deployment Guide

## Overview

This guide covers deployment processes and configurations for the Construct Depot platform.

## Deployment Environments

### 1. Development
```env
NODE_ENV=development
API_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost:5432/constructdepot_dev
REDIS_URL=redis://localhost:6379
```typescript

### 2. Staging
```env
NODE_ENV=staging
API_URL=https://api.staging.constructdepot.com
DATABASE_URL=postgresql://staging-db:5432/constructdepot_staging
REDIS_URL=redis://staging-redis:6379
```typescript

### 3. Production
```env
NODE_ENV=production
API_URL=https://api.constructdepot.com
DATABASE_URL=postgresql://prod-db:5432/constructdepot_prod
REDIS_URL=redis://prod-redis:6379
```typescript

## Build Process

### Frontend Build
```bash
# Install dependencies
npm ci

# Build application
npm run build

# Run type check
npm run type-check

# Run tests
npm run test:ci
```typescript

### Backend Build
```bash
# Generate Prisma client
npx prisma generate

# Build API
npm run build:api

# Run migrations
npx prisma migrate deploy
```typescript

## Deployment Process

### 1. Container Build
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```typescript

### 2. Container Deploy
```bash
# Build image
docker build -t constructdepot:latest .

# Push to registry
docker tag constructdepot:latest registry.example.com/constructdepot:latest
docker push registry.example.com/constructdepot:latest
```typescript

### 3. Kubernetes Deploy
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: constructdepot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: constructdepot
  template:
    metadata:
      labels:
        app: constructdepot
    spec:
      containers:
      - name: constructdepot
        image: registry.example.com/constructdepot:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: url
```typescript

## Infrastructure Setup

### 1. Database
```bash
# Create database
kubectl apply -f k8s/database/

# Run migrations
kubectl exec -it deployment/constructdepot -- \
  npx prisma migrate deploy
```typescript

### 2. Redis
```bash
# Deploy Redis cluster
kubectl apply -f k8s/redis/

# Verify deployment
kubectl get pods -l app=redis
```typescript

### 3. Load Balancer
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: constructdepot-ingress
spec:
  rules:
  - host: api.constructdepot.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: constructdepot-service
            port:
              number: 80
```typescript

## Monitoring Setup

### 1. Logging
```yaml
# fluentd-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      read_from_head true
      <parse>
        @type json
      </parse>
    </source>
```typescript

### 2. Metrics
```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
```typescript

## Rollback Procedure

### 1. Version Rollback
```bash
# Get deployment history
kubectl rollout history deployment/constructdepot

# Rollback to previous version
kubectl rollout undo deployment/constructdepot

# Verify rollback
kubectl rollout status deployment/constructdepot
```typescript

### 2. Database Rollback
```bash
# Get migration history
npx prisma migrate status

# Rollback migration
npx prisma migrate reset --to [MIGRATION_ID]
```typescript

## Best Practices

### 1. Security
- Use secrets management
- Enable SSL/TLS
- Configure firewalls
- Regular updates

### 2. Scaling
- Horizontal pod scaling
- Database replication
- Cache distribution
- Load balancing

### 3. Monitoring
- Set up alerts
- Monitor resources
- Track metrics
- Log aggregation

### 4. Backup
- Database backups
- Config backups
- Regular testing
- Retention policy

## Resources
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Monitoring Guide](../../../../monitoring/README.md)
- [Security Guide](../security/README.md) 