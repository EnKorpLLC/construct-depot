# API Documentation

## Overview
This document provides comprehensive documentation for the Bulk Buyer Group API endpoints.

## Authentication
All API requests must be authenticated using JWT tokens provided by the authentication system.

### Authentication Headers
```http
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication API
- [Authentication](./authentication.md)
  - User Registration
  - Login
  - Password Reset
  - Email Verification
  - MFA Setup and Verification

### User Management API
- [User Management](./users.md)
  - User CRUD Operations
  - Role Management
  - Profile Updates
  - Permission Management

### Order Management API
- [Orders](./orders.md)
  - Order Creation
  - Order Status Updates
  - Order History
  - Bulk Orders
  - Order Notifications

### Product Management API
- [Products](./products.md)
  - Product CRUD Operations
  - Inventory Management
  - Price Updates
  - Category Management

### Crawler API
- [Crawler](./crawler.md)
  - Crawler Configuration
  - Job Management
  - Status Monitoring
  - Results Retrieval

### Supplier Dashboard API
- [Supplier Dashboard](./supplier-dashboard.md)
  - Order Management
    * List orders
    * Filter by status
    * Update order status
  - Analytics
    * Sales metrics
    * Revenue charts
    * Customer insights
  - Inventory
    * Stock levels
    * Low stock alerts
    * Reorder points

## Error Handling
All API endpoints follow a standard error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {} // Optional additional information
  }
}
```

### Supplier Dashboard Errors
Supplier dashboard endpoints include additional error details:
```json
{
  "error": {
    "code": "SUPPLIER_ERROR",
    "message": "Error message",
    "details": {
      "component": "OrderManagement|Analytics|Inventory",
      "action": "list|update|analyze",
      "resourceId": "optional-resource-id"
    }
  }
}
```

## Rate Limiting
API requests are subject to rate limiting:
- Authentication endpoints: 5 requests per minute
- Standard endpoints: 60 requests per minute
- Crawler endpoints: 30 requests per minute
- Analytics endpoints: 20 requests per minute
- Order management endpoints: 40 requests per minute

## Versioning
Current API version: v1
Base URL: `/api/v1`

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Testing
For testing the API endpoints, refer to the [Testing Guide](../development/guides/testing.md) 