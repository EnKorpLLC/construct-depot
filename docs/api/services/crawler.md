# Crawler Service

Last Updated: 2025-01-21 20:34

# Crawler Service Documentation

## Overview

The Crawler Service is a high-performance web scraping system designed to extract product information from supplier websites. It features automatic rate limiting, error recovery, and performance optimization.

## Architecture

```mermaid
graph TD
    A[Crawler Manager] --> B[Job Scheduler]
    B --> C[Rate Limiter]
    C --> D[HTTP Client]
    D --> E[Data Extractor]
    E --> F[Data Validator]
    F --> G[Storage]
    H[Performance Monitor] --> A
    I[Error Recovery] --> A
```typescript

## Features

1. **Intelligent Rate Limiting**
   - Automatic rate adjustment based on server response
   - Respects robots.txt directives
   - Dynamic delay calculation
   - Concurrency management

2. **Error Recovery**
   - Automatic retry with exponential backoff
   - Error classification and handling
   - Session management
   - Proxy rotation

3. **Performance Optimization**
   - Memory usage monitoring
   - Request concurrency optimization
   - Response time tracking
   - Cache management

4. **Data Validation**
   - Schema validation
   - Data cleaning
   - Format standardization
   - Error reporting

## API Endpoints

### Configuration Management

#### Create Configuration
```http
POST /api/crawler/configs
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Supplier Crawler",
  "description": "Crawl supplier product catalog",
  "targetUrl": "https://supplier.example.com",
  "schedule": "0 0 * * *",
  "rateLimit": 60,
  "selectors": {
    "product": ".product-item",
    "name": ".product-name",
    "price": ".product-price",
    "description": ".product-description"
  }
}
```typescript

#### Update Configuration
```http
PUT /api/crawler/configs/{configId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "rateLimit": 30,
  "schedule": "0 */12 * * *"
}
```typescript

#### List Configurations
```http
GET /api/crawler/configs
Authorization: Bearer <token>
```typescript

### Job Management

#### Start Job
```http
POST /api/crawler/jobs
Content-Type: application/json
Authorization: Bearer <token>

{
  "configId": "config-123",
  "priority": "high",
  "options": {
    "maxPages": 1000,
    "maxDuration": 3600
  }
}
```typescript

#### Get Job Status
```http
GET /api/crawler/jobs/{jobId}
Authorization: Bearer <token>
```typescript

#### Stop Job
```http
POST /api/crawler/jobs/{jobId}/stop
Authorization: Bearer <token>
```typescript

## Performance Monitoring

### Metrics Tracked

1. **Request Metrics**
   - Requests per second
   - Success rate
   - Average response time
   - Error rate

2. **Resource Usage**
   - Memory usage
   - CPU utilization
   - Network bandwidth
   - Cache hit rate

3. **Job Metrics**
   - Pages processed
   - Items extracted
   - Processing time
   - Error count

### Performance Optimization

The service automatically optimizes performance based on:

1. **Response Times**
   ```javascript
   if (avgResponseTime > 2000ms) {
     decreaseConcurrency();
     increaseDelay();
   }
   ```typescript

2. **Success Rate**
   ```javascript
   if (successRate < 80%) {
     enableRetryMechanism();
     adjustRateLimit();
   }
   ```typescript

3. **Memory Usage**
   ```javascript
   if (memoryUsage > 80%) {
     clearJobCache();
     triggerGC();
   }
   ```typescript

## Error Handling

### Error Types

1. **Network Errors**
   - Connection timeout
   - DNS resolution failure
   - SSL/TLS errors

2. **Target Site Errors**
   - Rate limiting (429)
   - Server errors (5xx)
   - Authentication failures

3. **Data Errors**
   - Invalid data format
   - Missing required fields
   - Schema validation failures

### Recovery Strategies

1. **Temporary Failures**
   ```javascript
   {
     "strategy": "retry",
     "maxAttempts": 3,
     "backoffFactor": 1.5,
     "initialDelay": 1000
   }
   ```typescript

2. **Permanent Failures**
   ```javascript
   {
     "strategy": "skip",
     "logLevel": "error",
     "notification": true
   }
   ```typescript

## Best Practices

1. **Configuration**
   - Start with conservative rate limits
   - Use specific CSS selectors
   - Set reasonable timeouts
   - Enable error notifications

2. **Monitoring**
   - Monitor success rates
   - Track memory usage
   - Review error logs
   - Check performance metrics

3. **Maintenance**
   - Update selectors regularly
   - Review and adjust rate limits
   - Clean up old job data
   - Update proxy lists

## Security Considerations

1. **Authentication**
   - API key required
   - Rate limiting per user
   - Role-based access control
   - Token expiration

2. **Data Protection**
   - HTTPS only
   - Data encryption
   - Secure storage
   - Access logging

3. **Infrastructure**
   - IP rotation
   - Proxy management
   - Request signing
   - User agent rotation

## Example Integration

```typescript
import { CrawlerService } from '@/lib/services/crawler';

// Create configuration
const config = await CrawlerService.createConfig({
  name: 'Product Crawler',
  targetUrl: 'https://example.com',
  schedule: '0 0 * * *',
  rateLimit: 60
});

// Start job
const job = await CrawlerService.startJob({
  configId: config.id,
  options: {
    maxPages: 1000,
    maxDuration: 3600
  }
});

// Monitor progress
job.on('progress', (stats) => {
  console.log(`Processed ${stats.pagesProcessed} pages`);
  console.log(`Found ${stats.itemsFound} items`);
});

// Handle completion
job.on('complete', (result) => {
  console.log('Crawl completed:', result);
});

// Handle errors
job.on('error', (error) => {
  console.error('Crawl failed:', error);
});
``` 