# Analytics API

## Overview
Endpoints for retrieving analytics data, generating reports, and monitoring system metrics.

## Endpoints

### Get Order Analytics
```http
GET /api/v1/analytics/orders
```

#### Query Parameters
- `from`: Start date (required)
- `to`: End date (required)
- `interval`: Time interval for grouping (HOURLY, DAILY, WEEKLY, MONTHLY)
- `groupBy`: Group results by field (status, user, product)

#### Response
```json
{
  "analytics": {
    "totalOrders": 1500,
    "totalValue": 150000.00,
    "averageOrderValue": 100.00,
    "timeline": [
      {
        "timestamp": "2025-01-01T00:00:00Z",
        "orders": 50,
        "value": 5000.00
      }
    ],
    "breakdown": {
      "byStatus": {
        "COMPLETED": 1200,
        "PENDING": 200,
        "CANCELLED": 100
      },
      "byProduct": [
        {
          "productId": "product_id",
          "productName": "Example Product",
          "orders": 100,
          "value": 10000.00
        }
      ]
    }
  }
}
```

### Get User Analytics
```http
GET /api/v1/analytics/users
```

#### Query Parameters
- `from`: Start date (required)
- `to`: End date (required)
- `interval`: Time interval for grouping (DAILY, WEEKLY, MONTHLY)
- `segment`: User segment (NEW, ACTIVE, INACTIVE)

#### Response
```json
{
  "analytics": {
    "totalUsers": 5000,
    "activeUsers": 3000,
    "newUsers": 500,
    "timeline": [
      {
        "timestamp": "2025-01-01T00:00:00Z",
        "newUsers": 50,
        "activeUsers": 300
      }
    ],
    "engagement": {
      "dailyActive": 1500,
      "weeklyActive": 2500,
      "monthlyActive": 3000
    },
    "retention": {
      "day1": 80,
      "day7": 60,
      "day30": 40
    }
  }
}
```

### Get Product Analytics
```http
GET /api/v1/analytics/products
```

#### Query Parameters
- `from`: Start date (required)
- `to`: End date (required)
- `interval`: Time interval for grouping (DAILY, WEEKLY, MONTHLY)
- `category`: Filter by product category
- `minOrders`: Minimum number of orders

#### Response
```json
{
  "analytics": {
    "totalProducts": 1000,
    "activeProducts": 800,
    "topProducts": [
      {
        "productId": "product_id",
        "productName": "Example Product",
        "orders": 500,
        "revenue": 50000.00,
        "viewCount": 10000
      }
    ],
    "categories": [
      {
        "name": "Category 1",
        "products": 100,
        "orders": 1000,
        "revenue": 100000.00
      }
    ],
    "inventory": {
      "inStock": 700,
      "lowStock": 50,
      "outOfStock": 50
    }
  }
}
```

### Get Crawler Analytics
```http
GET /api/v1/analytics/crawler
```

#### Query Parameters
- `from`: Start date (required)
- `to`: End date (required)
- `configId`: Filter by crawler configuration
- `interval`: Time interval for grouping (HOURLY, DAILY, WEEKLY)

#### Response
```json
{
  "analytics": {
    "totalJobs": 1000,
    "successRate": 98.5,
    "averageJobDuration": 300,
    "timeline": [
      {
        "timestamp": "2025-01-01T00:00:00Z",
        "jobs": 50,
        "successRate": 98.0,
        "itemsProcessed": 5000
      }
    ],
    "performance": {
      "averageItemsPerJob": 200,
      "averageErrorsPerJob": 2,
      "averageProcessingTime": 0.5
    },
    "errors": {
      "byType": {
        "NETWORK": 50,
        "PARSING": 30,
        "TIMEOUT": 20
      }
    }
  }
}
```

### Generate Custom Report
```http
POST /api/v1/analytics/reports
```

#### Request Body
```json
{
  "name": "Monthly Performance Report",
  "type": "PERFORMANCE",
  "metrics": [
    "orders",
    "revenue",
    "users",
    "crawlerJobs"
  ],
  "dimensions": [
    "time",
    "category",
    "status"
  ],
  "filters": {
    "from": "2025-01-01T00:00:00Z",
    "to": "2025-01-31T23:59:59Z",
    "categories": ["category1", "category2"],
    "minRevenue": 1000
  },
  "format": "JSON"
}
```

#### Response
```json
{
  "report": {
    "id": "report_id",
    "name": "Monthly Performance Report",
    "status": "PROCESSING",
    "createdAt": "2025-01-11T00:00:00Z",
    "estimatedCompletion": "2025-01-11T00:05:00Z"
  }
}
```

### Get Report Status
```http
GET /api/v1/analytics/reports/:reportId
```

#### Response
```json
{
  "report": {
    "id": "report_id",
    "name": "Monthly Performance Report",
    "status": "COMPLETED",
    "results": {
      "summary": {
        "totalOrders": 1500,
        "totalRevenue": 150000.00,
        "activeUsers": 3000,
        "crawlerJobs": 1000
      },
      "timeline": [
        {
          "timestamp": "2025-01-01T00:00:00Z",
          "orders": 50,
          "revenue": 5000.00,
          "users": 300,
          "crawlerJobs": 30
        }
      ]
    },
    "completedAt": "2025-01-11T00:05:00Z"
  }
}
```

## Error Responses

### Invalid Date Range
```json
{
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "Invalid date range specified",
    "details": {
      "from": "Required field missing",
      "to": "Must be after from date"
    }
  }
}
```

### Report Not Found
```json
{
  "error": {
    "code": "REPORT_NOT_FOUND",
    "message": "Report not found"
  }
}
```

### Invalid Report Configuration
```json
{
  "error": {
    "code": "INVALID_REPORT_CONFIG",
    "message": "Invalid report configuration",
    "details": {
      "metrics": "At least one metric required",
      "dimensions": "Invalid dimension specified"
    }
  }
}
```

### Data Not Available
```json
{
  "error": {
    "code": "DATA_NOT_AVAILABLE",
    "message": "Data not available for specified criteria",
    "details": {
      "reason": "No data exists for the specified date range"
    }
  }
}
```

## Rate Limiting
- Analytics queries: 60 requests per minute
- Report generation: 10 requests per minute
- Report status checks: 120 requests per minute 