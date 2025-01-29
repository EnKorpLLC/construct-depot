# Crawler

Last Updated: 2025-01-21 20:34

# Crawler Service API

## Overview
Endpoints for managing web crawlers, configuring crawl jobs, and retrieving crawled data.

## Endpoints

### Create Crawler Configuration
```http
POST /api/v1/crawler/configs
```typescript

#### Request Body
```json
{
  "name": "Example Crawler",
  "targetUrl": "https://example.com/products",
  "schedule": {
    "frequency": "DAILY",
    "startTime": "00:00",
    "timezone": "UTC"
  },
  "selectors": {
    "productName": ".product-name",
    "productPrice": ".product-price",
    "productDescription": ".product-description",
    "productImage": ".product-image img"
  },
  "rateLimit": {
    "requestsPerMinute": 60,
    "concurrent": 2
  },
  "proxyConfig": {
    "useProxy": true,
    "rotationStrategy": "ROUND_ROBIN"
  },
  "retryConfig": {
    "maxRetries": 3,
    "delayBetweenRetries": 5000
  }
}
```typescript

#### Response
```json
{
  "config": {
    "id": "config_id",
    "name": "Example Crawler",
    "targetUrl": "https://example.com/products",
    "schedule": {
      "frequency": "DAILY",
      "startTime": "00:00",
      "timezone": "UTC",
      "nextRun": "2025-01-12T00:00:00Z"
    },
    "status": "ACTIVE",
    "createdAt": "2025-01-11T00:00:00Z"
  }
}
```typescript

### Get Crawler Configuration
```http
GET /api/v1/crawler/configs/:configId
```typescript

#### Response
```json
{
  "config": {
    "id": "config_id",
    "name": "Example Crawler",
    "targetUrl": "https://example.com/products",
    "schedule": {
      "frequency": "DAILY",
      "startTime": "00:00",
      "timezone": "UTC",
      "nextRun": "2025-01-12T00:00:00Z"
    },
    "selectors": {
      "productName": ".product-name",
      "productPrice": ".product-price",
      "productDescription": ".product-description",
      "productImage": ".product-image img"
    },
    "rateLimit": {
      "requestsPerMinute": 60,
      "concurrent": 2
    },
    "proxyConfig": {
      "useProxy": true,
      "rotationStrategy": "ROUND_ROBIN"
    },
    "retryConfig": {
      "maxRetries": 3,
      "delayBetweenRetries": 5000
    },
    "status": "ACTIVE",
    "lastRunAt": "2025-01-11T00:00:00Z",
    "nextRunAt": "2025-01-12T00:00:00Z",
    "createdAt": "2025-01-11T00:00:00Z",
    "updatedAt": "2025-01-11T00:00:00Z"
  }
}
```typescript

### List Crawler Configurations
```http
GET /api/v1/crawler/configs
```typescript

#### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (ACTIVE, PAUSED, ERROR)
- `search`: Search by name or target URL

#### Response
```json
{
  "configs": [
    {
      "id": "config_id",
      "name": "Example Crawler",
      "targetUrl": "https://example.com/products",
      "status": "ACTIVE",
      "lastRunAt": "2025-01-11T00:00:00Z",
      "nextRunAt": "2025-01-12T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```typescript

### Update Crawler Configuration
```http
PUT /api/v1/crawler/configs/:configId
```typescript

#### Request Body
```json
{
  "name": "Updated Crawler",
  "schedule": {
    "frequency": "HOURLY",
    "startTime": "00:30",
    "timezone": "UTC"
  },
  "rateLimit": {
    "requestsPerMinute": 30,
    "concurrent": 1
  }
}
```typescript

#### Response
```json
{
  "config": {
    "id": "config_id",
    "name": "Updated Crawler",
    "schedule": {
      "frequency": "HOURLY",
      "startTime": "00:30",
      "timezone": "UTC",
      "nextRun": "2025-01-11T00:30:00Z"
    },
    "status": "ACTIVE",
    "updatedAt": "2025-01-11T00:10:00Z"
  }
}
```typescript

### Start Crawler Job
```http
POST /api/v1/crawler/jobs
```typescript

#### Request Body
```json
{
  "configId": "config_id",
  "priority": "HIGH",
  "metadata": {
    "source": "manual",
    "requestedBy": "user_id"
  }
}
```typescript

#### Response
```json
{
  "job": {
    "id": "job_id",
    "configId": "config_id",
    "status": "QUEUED",
    "priority": "HIGH",
    "queuedAt": "2025-01-11T00:00:00Z",
    "estimatedStartTime": "2025-01-11T00:01:00Z"
  }
}
```typescript

### Get Crawler Job Status
```http
GET /api/v1/crawler/jobs/:jobId
```typescript

#### Response
```json
{
  "job": {
    "id": "job_id",
    "configId": "config_id",
    "status": "RUNNING",
    "progress": {
      "pagesProcessed": 10,
      "itemsFound": 150,
      "errors": 0,
      "percentComplete": 45
    },
    "startedAt": "2025-01-11T00:01:00Z",
    "estimatedCompletion": "2025-01-11T00:10:00Z"
  }
}
```typescript

### List Crawler Jobs
```http
GET /api/v1/crawler/jobs
```typescript

#### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `configId`: Filter by configuration ID
- `status`: Filter by status (QUEUED, RUNNING, COMPLETED, FAILED)
- `from`: Start date
- `to`: End date

#### Response
```json
{
  "jobs": [
    {
      "id": "job_id",
      "configId": "config_id",
      "status": "COMPLETED",
      "itemsProcessed": 200,
      "startedAt": "2025-01-11T00:01:00Z",
      "completedAt": "2025-01-11T00:10:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```typescript

### Get Crawler Results
```http
GET /api/v1/crawler/jobs/:jobId/results
```typescript

#### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (SUCCESS, ERROR)

#### Response
```json
{
  "results": [
    {
      "url": "https://example.com/products/1",
      "data": {
        "productName": "Example Product",
        "productPrice": "99.99",
        "productDescription": "Product description",
        "productImage": "https://example.com/images/product1.jpg"
      },
      "status": "SUCCESS",
      "processedAt": "2025-01-11T00:05:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```typescript

## Error Responses

### Configuration Not Found
```json
{
  "error": {
    "code": "CONFIG_NOT_FOUND",
    "message": "Crawler configuration not found"
  }
}
```typescript

### Invalid Configuration
```json
{
  "error": {
    "code": "INVALID_CONFIG",
    "message": "Invalid crawler configuration",
    "details": {
      "selectors": "Required field missing",
      "rateLimit": "Must be greater than 0"
    }
  }
}
```typescript

### Job Not Found
```json
{
  "error": {
    "code": "JOB_NOT_FOUND",
    "message": "Crawler job not found"
  }
}
```typescript

### Rate Limit Exceeded
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "retryAfter": 60
    }
  }
}
```typescript

## Rate Limiting
- Configuration management: 30 requests per minute
- Job management: 60 requests per minute
- Results retrieval: 120 requests per minute 