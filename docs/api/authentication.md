# Authentication API

## Overview
Authentication endpoints for user registration, login, password management, and MFA.

## Endpoints

### Register User
```http
POST /api/v1/auth/register
```

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Example Corp",
  "role": "CUSTOMER"
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
    "role": "CUSTOMER"
  }
}
```

### Login
```http
POST /api/v1/auth/login
```

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Response
```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "CUSTOMER"
  }
}
```

### Request Password Reset
```http
POST /api/v1/auth/password/reset-request
```

#### Request Body
```json
{
  "email": "user@example.com"
}
```

#### Response
```json
{
  "message": "Password reset email sent"
}
```

### Reset Password
```http
POST /api/v1/auth/password/reset
```

#### Request Body
```json
{
  "token": "reset_token",
  "newPassword": "newSecurePassword123"
}
```

#### Response
```json
{
  "message": "Password reset successful"
}
```

### Setup MFA
```http
POST /api/v1/auth/mfa/setup
```

#### Response
```json
{
  "secret": "TOTP_SECRET",
  "qrCode": "QR_CODE_URL"
}
```

### Verify MFA
```http
POST /api/v1/auth/mfa/verify
```

#### Request Body
```json
{
  "code": "123456"
}
```

#### Response
```json
{
  "verified": true
}
```

### Verify Email
```http
GET /api/v1/auth/verify-email/:token
```

#### Response
```json
{
  "message": "Email verified successfully"
}
```

## Error Responses

### Invalid Credentials
```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

### Email Not Verified
```json
{
  "error": {
    "code": "AUTH_EMAIL_NOT_VERIFIED",
    "message": "Please verify your email address"
  }
}
```

### MFA Required
```json
{
  "error": {
    "code": "AUTH_MFA_REQUIRED",
    "message": "Multi-factor authentication required"
  }
}
```

## Rate Limiting
- Registration: 5 attempts per hour per IP
- Login: 5 attempts per 15 minutes per IP/email combination
- Password Reset: 3 attempts per hour per email
- MFA Verification: 5 attempts per 15 minutes per user 