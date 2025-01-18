# Product Management API

## Overview
Endpoints for managing products, inventory, and pricing.

## Endpoints

### Create Product
```http
POST /api/v1/products
```

#### Request Body
```json
{
  "name": "Example Product",
  "description": "Detailed product description",
  "price": 99.99,
  "minOrderQuantity": 10,
  "unit": "pieces",
  "categories": ["category1", "category2"],
  "specifications": {
    "size": "large",
    "weight": "5kg",
    "material": "steel"
  },
  "markup": 1.20,
  "currentStock": 100,
  "lowStockThreshold": 20,
  "reorderPoint": 30,
  "reorderQuantity": 50,
  "taxCode": "TAX001",
  "images": ["url1", "url2"]
}
```

#### Response
```json
{
  "product": {
    "id": "product_id",
    "name": "Example Product",
    "description": "Detailed product description",
    "price": 99.99,
    "minOrderQuantity": 10,
    "unit": "pieces",
    "categories": ["category1", "category2"],
    "specifications": {
      "size": "large",
      "weight": "5kg",
      "material": "steel"
    },
    "markup": 1.20,
    "currentStock": 100,
    "inventoryStatus": "IN_STOCK",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### Get Product
```http
GET /api/v1/products/:productId
```

#### Response
```json
{
  "product": {
    "id": "product_id",
    "name": "Example Product",
    "description": "Detailed product description",
    "price": 99.99,
    "minOrderQuantity": 10,
    "unit": "pieces",
    "categories": ["category1", "category2"],
    "specifications": {
      "size": "large",
      "weight": "5kg",
      "material": "steel"
    },
    "inventoryStatus": "IN_STOCK",
    "currentStock": 100,
    "images": ["url1", "url2"],
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### List Products
```http
GET /api/v1/products
```

#### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `category`: Filter by category
- `search`: Search by name or description
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `inStock`: Filter by stock availability (true/false)

#### Response
```json
{
  "products": [
    {
      "id": "product_id",
      "name": "Example Product",
      "price": 99.99,
      "inventoryStatus": "IN_STOCK",
      "currentStock": 100,
      "categories": ["category1"]
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

### Update Product
```http
PUT /api/v1/products/:productId
```

#### Request Body
```json
{
  "name": "Updated Product Name",
  "price": 149.99,
  "specifications": {
    "size": "medium",
    "weight": "3kg",
    "material": "aluminum"
  }
}
```

#### Response
```json
{
  "product": {
    "id": "product_id",
    "name": "Updated Product Name",
    "price": 149.99,
    "specifications": {
      "size": "medium",
      "weight": "3kg",
      "material": "aluminum"
    },
    "updatedAt": "2025-01-01T00:10:00Z"
  }
}
```

### Update Inventory
```http
PATCH /api/v1/products/:productId/inventory
```

#### Request Body
```json
{
  "adjustment": 50,
  "type": "RESTOCK",
  "reason": "New shipment received",
  "reference": "PO12345"
}
```

#### Response
```json
{
  "product": {
    "id": "product_id",
    "currentStock": 150,
    "inventoryStatus": "IN_STOCK",
    "lastRestockDate": "2025-01-01T00:00:00Z"
  }
}
```

### Get Inventory History
```http
GET /api/v1/products/:productId/inventory/history
```

#### Query Parameters
- `from`: Start date
- `to`: End date
- `type`: Filter by adjustment type (RESTOCK, SALE, ADJUSTMENT)

#### Response
```json
{
  "history": [
    {
      "type": "RESTOCK",
      "quantity": 50,
      "timestamp": "2025-01-01T00:00:00Z",
      "reason": "New shipment received",
      "reference": "PO12345",
      "createdBy": "user_id"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### Delete Product
```http
DELETE /api/v1/products/:productId
```

#### Response
```json
{
  "message": "Product deleted successfully"
}
```

## Error Responses

### Product Not Found
```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  }
}
```

### Invalid Price
```json
{
  "error": {
    "code": "INVALID_PRICE",
    "message": "Price must be greater than 0"
  }
}
```

### Invalid Stock Adjustment
```json
{
  "error": {
    "code": "INVALID_STOCK_ADJUSTMENT",
    "message": "Cannot reduce stock below 0",
    "details": {
      "currentStock": 10,
      "requestedAdjustment": -20
    }
  }
}
```

## Rate Limiting
- Product creation: 30 requests per minute
- Product updates: 60 requests per minute
- Inventory updates: 120 requests per minute
- List/Search: 180 requests per minute 