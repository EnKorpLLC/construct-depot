# API Documentation

## Overview
The Construct Depot API is organized around REST principles. Our API accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes and authentication.

## Base URL
```
Development: http://localhost:3001/api
Staging: https://construct-depot.vercel.app/api
Production: https://api.constructdepot.com/api
```

## Authentication
All API requests require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## API Endpoints

### Order Management
- `POST /orders` - Create a new order
- `GET /orders` - List orders
- `GET /orders/:id` - Get order details
- `PATCH /orders/:id/status` - Update order status
- `GET /orders/:id/history` - Get order history

### Inventory Management
- `GET /products` - List products
- `GET /products/:id` - Get product details
- `PATCH /products/:id/stock` - Update stock levels
- `GET /products/:id/history` - Get stock history

### User Management
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /users/me` - Get current user
- `PATCH /users/:id` - Update user details

### Dashboard APIs
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /dashboard/activities` - Get recent activities
- `GET /dashboard/alerts` - Get system alerts

### Crawler Management
- `POST /crawler/jobs` - Create crawler job
- `GET /crawler/jobs` - List crawler jobs
- `GET /crawler/jobs/:id` - Get job details
- `PATCH /crawler/jobs/:id` - Update job status

## Response Format
```json
{
  "data": {
    // Response data
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  },
  "error": null
}
```

## Error Handling
```json
{
  "data": null,
  "meta": {},
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

## Rate Limiting
- 1000 requests per hour per API key
- Rate limit headers included in responses:
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1640995200
  ```

## Pagination
Use `page` and `limit` query parameters:
```
GET /api/orders?page=1&limit=10
```

## Filtering
Use query parameters for filtering:
```
GET /api/orders?status=PENDING&createdAfter=2024-01-01
```

## Sorting
Use `sort` parameter:
```
GET /api/orders?sort=createdAt:desc
```

## Versioning
- Current version: v1
- Include version in header:
  ```
  Accept: application/json; version=1
  ```

## SDK & Examples
- [Node.js SDK](link-to-sdk)
- [Python SDK](link-to-sdk)
- [Example Applications](link-to-examples)

## Support
For API support, contact:
- Email: api-support@constructdepot.com
- Documentation Issues: [GitHub Issues](link-to-issues) 