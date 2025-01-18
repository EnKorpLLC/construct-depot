# Monitoring Setup Guide

Last Modified: 2024-01-19

## Crawler Monitoring
Status: ✅ Implemented

### Dashboard
- Location: `/admin/crawler`
- Components:
  - Real-time job status monitoring
  - Configuration management overview
  - Error tracking and reporting

### Metrics Tracked
1. Job Performance
   - Pages processed
   - Items found
   - Processing time
   - Error rate

2. System Health
   - Active crawlers
   - Queue status
   - Rate limit compliance
   - Resource usage

### Alerts
- Job failure notifications
- Rate limit warnings
- Resource utilization alerts
- Error threshold notifications

### Logging
- Job execution logs
- Error details with stack traces
- Performance metrics
- Configuration changes

## 1. Error Tracking (Sentry)

### 1.1 Initial Setup
```bash
# Install Sentry SDK
npm install @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard@latest -i nextjs
```

### 1.2 Configuration
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
});

// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 1.3 Alert Configuration
- Set up error alerts in Sentry dashboard
- Configure notification channels
- Set up error grouping rules
- Define alert thresholds

## 2. Performance Monitoring

### 2.1 Vercel Analytics
- Enable Analytics in Vercel dashboard
- Configure custom metrics
- Set up performance budgets
- Enable real user monitoring

### 2.2 Custom Metrics
```typescript
// lib/monitoring.ts
export const trackMetric = async (name: string, value: number, tags: Record<string, string>) => {
  // Implementation for custom metric tracking
};

export const trackEvent = async (name: string, properties: Record<string, any>) => {
  // Implementation for custom event tracking
};
```

### 2.3 API Monitoring
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const start = performance.now();
  
  // Your middleware logic here
  
  const duration = performance.now() - start;
  await trackMetric('api_response_time', duration, {
    path: request.nextUrl.pathname,
  });
}
```

## 3. Health Checks

### 3.1 Endpoint Configuration
```typescript
// app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      api: true,
    },
    version: process.env.NEXT_PUBLIC_APP_VERSION,
  };
  
  return NextResponse.json(health);
}
```

### 3.2 Monitoring Services
- Set up UptimeRobot for endpoint monitoring
- Configure StatusPage integration
- Set up incident management
- Configure status notifications

## 4. Resource Monitoring

### 4.1 Database Monitoring
- Enable Neon database metrics
- Set up connection pool monitoring
- Configure query performance tracking
- Set up slow query alerts

### 4.2 Redis Monitoring
- Enable Redis Cloud metrics
- Monitor memory usage
- Track connection stats
- Set up capacity alerts

### 4.3 Application Monitoring
- Monitor server memory usage
- Track CPU utilization
- Monitor disk usage
- Set up resource alerts

## 5. Logging

### 5.1 Application Logs
- Configure structured logging
- Set up log retention
- Enable log search
- Configure log alerts

### 5.2 Access Logs
- Enable Vercel access logs
- Configure log formatting
- Set up log analysis
- Monitor traffic patterns

## 6. Alerting

### 6.1 Alert Channels
- Email notifications
- Slack integration
- SMS alerts (critical issues)
- On-call rotation

### 6.2 Alert Rules
- Error rate thresholds
- Performance degradation
- Resource utilization
- Security incidents

## 7. Dashboards

### 7.1 Metrics Dashboard
- System health overview
- Performance metrics
- Error rates
- Resource utilization

### 7.2 Business Metrics
- User activity
- Transaction volume
- Feature usage
- Error impact

## 8. Documentation

### 8.1 Runbooks
- Incident response procedures
- Common issue resolution
- Escalation procedures
- Recovery processes

### 8.2 Alerts Documentation
- Alert descriptions
- Response procedures
- Escalation paths
- Resolution steps

## Implementation Steps

1. Set up error tracking
2. Configure performance monitoring
3. Implement health checks
4. Set up resource monitoring
5. Configure logging
6. Set up alerting
7. Create dashboards
8. Document procedures

## Maintenance

- Regular review of alerts
- Update monitoring thresholds
- Refine alerting rules
- Update documentation 