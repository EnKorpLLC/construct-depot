# Supplier Dashboard API

## Overview
The Supplier Dashboard API provides endpoints for managing orders, analyzing sales data, and monitoring inventory for suppliers.

## Authentication
All endpoints require supplier authentication:
```http
Authorization: Bearer <supplier_jwt_token>
```

## Endpoints

### Order Management

#### List Orders
```http
GET /api/supplier/orders
```

Query Parameters:
- `status`: Filter by order status (optional)
- `page`: Page number for pagination (default: 1)
- `limit`: Items per page (default: 10)

Response:
```json
{
  "orders": [
    {
      "id": "string",
      "orderNumber": "string",
      "customerName": "string",
      "status": "pending|processing|shipped|delivered|cancelled",
      "total": "number",
      "items": "number",
      "createdAt": "string"
    }
  ],
  "pagination": {
    "total": "number",
    "pages": "number",
    "current": "number"
  }
}
```

### Analytics

#### Sales Data
```http
GET /api/supplier/analytics/sales
```

Query Parameters:
- `timeframe`: week|month|year (default: month)

Response:
```json
{
  "labels": ["string[]"],
  "revenue": ["number[]"],
  "orders": ["number[]"],
  "averageOrderValue": "number",
  "topProducts": [
    {
      "name": "string",
      "revenue": "number",
      "quantity": "number"
    }
  ]
}
```

#### Customer Insights
```http
GET /api/supplier/analytics/customers
```

Response:
```json
{
  "totalCustomers": "number",
  "newCustomers": "number",
  "repeatCustomers": "number",
  "averageCustomerValue": "number",
  "topCustomers": [
    {
      "id": "string",
      "name": "string",
      "totalSpent": "number",
      "orderCount": "number",
      "lastOrder": "string",
      "status": "active|inactive"
    }
  ],
  "customerSegments": [
    {
      "name": "string",
      "count": "number",
      "percentage": "number"
    }
  ]
}
```

### Inventory Management

#### Get Inventory Overview
```http
GET /api/supplier/inventory
```

Response:
```json
{
  "totalProducts": "number",
  "lowStockItems": "number",
  "reorderNeeded": "number",
  "products": [
    {
      "id": "string",
      "name": "string",
      "sku": "string",
      "currentStock": "number",
      "reorderPoint": "number",
      "status": "in_stock|low_stock|out_of_stock"
    }
  ]
}
```

## Rate Limiting
- Analytics endpoints: 20 requests per minute
- Order management endpoints: 40 requests per minute
- Inventory endpoints: 30 requests per minute

## Error Handling
All endpoints use the standard error format with supplier-specific details:
```json
{
  "error": {
    "code": "SUPPLIER_ERROR",
    "message": "Error description",
    "details": {
      "component": "OrderManagement|Analytics|Inventory",
      "action": "list|update|analyze",
      "resourceId": "optional-resource-id"
    }
  }
}
```

## Changelog
- 2025-01-11: Added supplier dashboard endpoints
- 2025-01-11: Updated rate limiting for analytics endpoints
- 2025-01-11: Added detailed error handling for supplier operations 