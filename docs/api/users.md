# User Management API

## Overview
Endpoints for managing users, roles, and permissions.

## Endpoints

### Get User Profile
```http
GET /api/v1/users/profile
```

#### Response
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Example Corp",
    "role": "CUSTOMER",
    "taxExempt": false,
    "taxExemptionNumber": null,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### Update User Profile
```http
PATCH /api/v1/users/profile
```

#### Request Body
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "New Corp Name",
  "taxExempt": true,
  "taxExemptionNumber": "TAX123"
}
```

#### Response
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "New Corp Name",
    "taxExempt": true,
    "taxExemptionNumber": "TAX123",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### List Users (Admin Only)
```http
GET /api/v1/users
```

#### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `role`: Filter by role
- `search`: Search by name or email

#### Response
```json
{
  "users": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "createdAt": "2025-01-01T00:00:00Z"
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

### Get User Details (Admin Only)
```http
GET /api/v1/users/:userId
```

#### Response
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Example Corp",
    "role": "CUSTOMER",
    "taxExempt": false,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "orders": {
      "total": 10,
      "completed": 8,
      "pending": 2
    },
    "activity": {
      "lastLogin": "2025-01-01T00:00:00Z",
      "lastOrder": "2025-01-01T00:00:00Z"
    }
  }
}
```

### Update User (Admin Only)
```http
PUT /api/v1/users/:userId
```

#### Request Body
```json
{
  "role": "SUPPLIER",
  "taxExempt": true,
  "taxExemptionNumber": "TAX123",
  "status": "ACTIVE"
}
```

#### Response
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "SUPPLIER",
    "taxExempt": true,
    "taxExemptionNumber": "TAX123",
    "status": "ACTIVE",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### Delete User (Admin Only)
```http
DELETE /api/v1/users/:userId
```

#### Response
```json
{
  "message": "User deleted successfully"
}
```

### Get User Activity (Admin Only)
```http
GET /api/v1/users/:userId/activity
```

#### Query Parameters
- `from`: Start date
- `to`: End date
- `type`: Activity type (login, order, profile_update)

#### Response
```json
{
  "activities": [
    {
      "type": "login",
      "timestamp": "2025-01-01T00:00:00Z",
      "details": {
        "ip": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

## Error Responses

### User Not Found
```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

### Invalid Role
```json
{
  "error": {
    "code": "INVALID_ROLE",
    "message": "Invalid role specified"
  }
}
```

### Permission Denied
```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Insufficient permissions to perform this action"
  }
}
```

## Rate Limiting
- Standard endpoints: 60 requests per minute
- Admin endpoints: 120 requests per minute
- Profile updates: 10 requests per minute per user 