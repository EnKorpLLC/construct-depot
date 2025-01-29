# Api Reference

Last Updated: 2025-01-21 20:34

# API Reference

## Overview

This document provides information about api-reference.


## Base URLs
- Development: `http://localhost:3000/api`
- Staging: `https://staging.bulkbuyergroup.com/api`
- Production: `https://bulkbuyergroup.com/api`

## Authentication
All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```typescript
Authorization: Bearer <token>
```typescript

## Order Management

### Get Orders
```http
GET /orders
```typescript

Query Parameters:
- `status` (optional): Filter by order status
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sort` (optional): Sort field (default: createdAt)
- `order` (optional): Sort order (asc/desc, default: desc)

Response:
```json
{
  "orders": [
    {
      "id": "string",
      "status": "PENDING",
      "userId": "string",
      "items": [...],
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": 0,
  "page": 1,
  "limit": 10
}
```typescript

### Get Order by ID
```http
GET /orders/{orderId}
```typescript

Response:
```json
{
  "id": "string",
  "status": "PENDING",
  "userId": "string",
  "items": [
    {
      "id": "string",
      "productId": "string",
      "quantity": 0,
      "price": 0
    }
  ],
  "history": [...],
  "createdAt": "string",
  "updatedAt": "string"
}
```typescript

### Create Order
```http
POST /orders
```typescript

Request Body:
```json
{
  "items": [
    {
      "productId": "string",
      "quantity": 0
    }
  ],
  "shippingAddress": "string",
  "shippingCity": "string",
  "shippingState": "string",
  "shippingZip": "string"
}
```typescript

### Update Order Status
```http
PUT /orders/{orderId}/status
```typescript

Request Body:
```json
{
  "status": "PROCESSING",
  "note": "string"
}
```typescript

## Product Management

### Get Products
```http
GET /products
```typescript

Query Parameters:
- `search` (optional): Search term for product name/description
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page
- `sort` (optional): Sort field
- `order` (optional): Sort order

Response:
```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": 0,
      "currentStock": 0,
      "minOrderQuantity": 0
    }
  ],
  "total": 0,
  "page": 1,
  "limit": 10
}
```typescript

### Get Product by ID
```http
GET /products/{productId}
```typescript

### Create Product
```http
POST /products
```typescript

Request Body:
```json
{
  "name": "string",
  "description": "string",
  "price": 0,
  "currentStock": 0,
  "minOrderQuantity": 0,
  "supplierId": "string"
}
```typescript

### Update Product
```http
PUT /products/{productId}
```typescript

## User Management

### Register User
```http
POST /auth/register
```typescript

Request Body:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "CUSTOMER"
}
```typescript

### Login
```http
POST /auth/login
```typescript

Request Body:
```json
{
  "email": "string",
  "password": "string"
}
```typescript

Response:
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "CUSTOMER"
  }
}
```typescript

## Dashboard APIs

### Get Order Statistics
```http
GET /dashboard/orders/stats
```typescript

Response:
```json
{
  "total": 0,
  "pending": 0,
  "processing": 0,
  "completed": 0,
  "cancelled": 0
}
```typescript

### Get Revenue Analytics
```http
GET /dashboard/revenue
```typescript

Query Parameters:
- `period`: daily/weekly/monthly/yearly

Response:
```json
{
  "data": [
    {
      "date": "string",
      "revenue": 0,
      "orders": 0
    }
  ]
}
```typescript

## Crawler Management

### Start Crawler
```http
POST /crawler/start
```typescript

Request Body:
```json
{
  "url": "string",
  "options": {
    "depth": 0,
    "maxPages": 0
  }
}
```typescript

### Get Crawler Status
```http
GET /crawler/status/{jobId}
```typescript

Response:
```json
{
  "status": "string",
  "progress": 0,
  "results": [...]
}
```typescript

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```typescript

Common Error Codes:
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Validation Error
- `500`: Internal Server Error

## Rate Limiting
- Rate limit: 100 requests per minute per IP
- Rate limit headers included in response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Versioning
API versioning is handled through the URL path:
```typescript
/api/v1/resource
```typescript

Current version: v1

## SDKs and Tools
- JavaScript/TypeScript SDK: [GitHub Repository]
- API Playground: [Interactive Documentation]
- Postman Collection: [Download Link]

## Support
For API support, contact:
- Email: api-support@bulkbuyergroup.com
- Documentation: docs.bulkbuyergroup.com
- Status Page: status.bulkbuyergroup.com 