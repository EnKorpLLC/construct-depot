# Order Management API

## Overview
Endpoints for managing orders, including creation, updates, and tracking.

## Endpoints

### Create Order
```http
POST /api/v1/orders
```

#### Request Body
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 5
    }
  ],
  "shippingAddress": {
    "address": "123 Main St",
    "city": "Example City",
    "state": "CA",
    "zip": "12345",
    "country": "US"
  },
  "taxExempt": false,
  "taxExemptionNumber": null
}
```

#### Response
```json
{
  "order": {
    "id": "order_id",
    "status": "PENDING",
    "totalAmount": 500.00,
    "subtotal": 450.00,
    "taxAmount": 50.00,
    "items": [
      {
        "productId": "product_id",
        "quantity": 5,
        "unitPrice": 90.00,
        "totalPrice": 450.00
      }
    ],
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### Get Order
```http
GET /api/v1/orders/:orderId
```

#### Response
```json
{
  "order": {
    "id": "order_id",
    "status": "PROCESSING",
    "totalAmount": 500.00,
    "subtotal": 450.00,
    "taxAmount": 50.00,
    "items": [
      {
        "productId": "product_id",
        "quantity": 5,
        "unitPrice": 90.00,
        "totalPrice": 450.00
      }
    ],
    "shippingAddress": {
      "address": "123 Main St",
      "city": "Example City",
      "state": "CA",
      "zip": "12345",
      "country": "US"
    },
    "history": [
      {
        "status": "PENDING",
        "timestamp": "2025-01-01T00:00:00Z",
        "note": "Order created"
      },
      {
        "status": "PROCESSING",
        "timestamp": "2025-01-01T00:10:00Z",
        "note": "Payment confirmed"
      }
    ],
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:10:00Z"
  }
}
```

### List Orders
```http
GET /api/v1/orders
```

#### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status
- `from`: Start date
- `to`: End date

#### Response
```json
{
  "orders": [
    {
      "id": "order_id",
      "status": "PROCESSING",
      "totalAmount": 500.00,
      "createdAt": "2025-01-01T00:00:00Z",
      "items": [
        {
          "productId": "product_id",
          "quantity": 5
        }
      ]
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

### Update Order Status
```http
PATCH /api/v1/orders/:orderId/status
```

#### Request Body
```json
{
  "status": "PROCESSING",
  "note": "Payment confirmed"
}
```

#### Response
```json
{
  "order": {
    "id": "order_id",
    "status": "PROCESSING",
    "updatedAt": "2025-01-01T00:10:00Z"
  }
}
```

### Cancel Order
```http
POST /api/v1/orders/:orderId/cancel
```

#### Request Body
```json
{
  "reason": "Customer request",
  "note": "Customer changed their mind"
}
```

#### Response
```json
{
  "order": {
    "id": "order_id",
    "status": "CANCELLED",
    "updatedAt": "2025-01-01T00:15:00Z"
  }
}
```

### Get Order History
```http
GET /api/v1/orders/:orderId/history
```

#### Response
```json
{
  "history": [
    {
      "status": "PENDING",
      "timestamp": "2025-01-01T00:00:00Z",
      "note": "Order created",
      "userId": "user_id"
    },
    {
      "status": "PROCESSING",
      "timestamp": "2025-01-01T00:10:00Z",
      "note": "Payment confirmed",
      "userId": "admin_id"
    }
  ]
}
```

### Create Bulk Order
```http
POST /api/v1/orders/bulk
```

#### Request Body
```json
{
  "orders": [
    {
      "items": [
        {
          "productId": "product_id",
          "quantity": 5
        }
      ],
      "shippingAddress": {
        "address": "123 Main St",
        "city": "Example City",
        "state": "CA",
        "zip": "12345"
      }
    }
  ]
}
```

#### Response
```json
{
  "orders": [
    {
      "id": "order_id",
      "status": "PENDING",
      "totalAmount": 500.00
    }
  ],
  "failed": []
}
```

## Error Responses

### Order Not Found
```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found"
  }
}
```

### Invalid Status Transition
```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot transition from DELIVERED to PROCESSING"
  }
}
```

### Insufficient Stock
```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for product_id",
    "details": {
      "productId": "product_id",
      "requested": 5,
      "available": 3
    }
  }
}
```

## Rate Limiting
- Order creation: 30 requests per minute
- Status updates: 60 requests per minute
- Bulk operations: 10 requests per minute 