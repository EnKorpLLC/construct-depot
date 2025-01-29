# Suppliers API
Last Updated: 2025-01-21 20:34

## Overview
The Suppliers API provides endpoints for managing supplier accounts, inventory, and relationships in the Construct Depot platform.

## Base URL
```typescript
/api/suppliers
```typescript

## Authentication
All endpoints require authentication with supplier or admin role.
```typescript
Authorization: Bearer <token>
```typescript

## Endpoints

### List Suppliers
```http
GET /api/suppliers
```typescript

Query Parameters:
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by supplier status (ACTIVE, PENDING, SUSPENDED)
- `category` (optional): Filter by product category
- `search` (optional): Search in company name and description

Response:
```json
{
  "suppliers": [
    {
      "id": "string",
      "companyName": "string",
      "status": "ACTIVE | PENDING | SUSPENDED",
      "rating": "number",
      "categories": ["string"],
      "joinedDate": "string (ISO date)",
      "location": {
        "city": "string",
        "state": "string",
        "country": "string"
      }
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalItems": "number"
  }
}
```typescript

### Get Supplier Profile
```http
GET /api/suppliers/{supplierId}
```typescript

Path Parameters:
- `supplierId`: Unique identifier of the supplier

Response:
```json
{
  "id": "string",
  "companyName": "string",
  "description": "string",
  "status": "string",
  "rating": "number",
  "categories": ["string"],
  "contactInfo": {
    "email": "string",
    "phone": "string",
    "website": "string"
  },
  "location": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "businessHours": {
    "monday": { "open": "string", "close": "string" },
    "tuesday": { "open": "string", "close": "string" },
    "wednesday": { "open": "string", "close": "string" },
    "thursday": { "open": "string", "close": "string" },
    "friday": { "open": "string", "close": "string" }
  },
  "metrics": {
    "totalOrders": "number",
    "averageRating": "number",
    "responseTime": "string",
    "fulfillmentRate": "number"
  }
}
```typescript

### Update Supplier Profile
```http
PATCH /api/suppliers/{supplierId}
```typescript

Request Body:
```json
{
  "companyName": "string (optional)",
  "description": "string (optional)",
  "categories": ["string"] (optional),
  "contactInfo": {
    "email": "string (optional)",
    "phone": "string (optional)",
    "website": "string (optional)"
  },
  "location": {
    "street": "string (optional)",
    "city": "string (optional)",
    "state": "string (optional)",
    "zipCode": "string (optional)",
    "country": "string (optional)"
  },
  "businessHours": {
    "monday": { "open": "string", "close": "string" },
    "tuesday": { "open": "string", "close": "string" }
  }
}
```typescript

Response:
```json
{
  "id": "string",
  "companyName": "string",
  "updatedAt": "string (ISO date)"
}
```typescript

### Get Supplier Inventory
```http
GET /api/suppliers/{supplierId}/inventory
```typescript

Query Parameters:
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page
- `category` (optional): Filter by category
- `inStock` (optional): Filter by availability

Response:
```json
{
  "inventory": [
    {
      "productId": "string",
      "name": "string",
      "quantity": "number",
      "price": "number",
      "category": "string",
      "lastUpdated": "string (ISO date)"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalItems": "number"
  }
}
```typescript

### Update Inventory Item
```http
PATCH /api/suppliers/{supplierId}/inventory/{productId}
```typescript

Request Body:
```json
{
  "quantity": "number (optional)",
  "price": "number (optional)",
  "inStock": "boolean (optional)"
}
```typescript

Response:
```json
{
  "productId": "string",
  "quantity": "number",
  "price": "number",
  "updatedAt": "string (ISO date)"
}
```typescript

### Get Supplier Orders
```http
GET /api/suppliers/{supplierId}/orders
```typescript

Query Parameters:
- `page` (optional): Page number for pagination
- `status` (optional): Filter by order status
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

Response:
```json
{
  "orders": [
    {
      "orderId": "string",
      "customerName": "string",
      "status": "string",
      "totalAmount": "number",
      "items": [
        {
          "productId": "string",
          "quantity": "number",
          "price": "number"
        }
      ],
      "createdAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalItems": "number"
  }
}
```typescript

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid request parameters",
  "details": {
    "field": "error description"
  }
}
```typescript

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```typescript

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```typescript

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Supplier not found"
}
```typescript

## Rate Limiting
- Public endpoints: 50 requests per minute
- Authenticated endpoints: 100 requests per minute
- Inventory updates: 200 requests per minute
- Profile updates: 10 requests per minute

## Caching
- GET requests are cached for 5 minutes
- Inventory listings cached for 1 minute
- Profile data cached for 10 minutes
- Cache invalidated on profile or inventory updates

## WebSocket Events
Supplier endpoints emit the following events:
- `supplier.statusUpdate`: When supplier status changes
- `supplier.inventoryUpdate`: When inventory is updated
- `supplier.orderReceived`: When new order is received
- `supplier.profileUpdate`: When profile is updated 