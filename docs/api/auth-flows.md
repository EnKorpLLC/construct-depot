# Authentication Flows

This document outlines the authentication flows used in our API.

## Standard Login Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant D as Database
    participant T as Token Service

    C->>A: POST /api/auth/login
    A->>D: Verify Credentials
    D-->>A: User Found
    A->>T: Generate Tokens
    T-->>A: Access & Refresh Tokens
    A-->>C: Return Tokens + User Info
```

## OAuth2 Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant O as OAuth Provider
    participant D as Database

    C->>A: GET /api/auth/oauth/{provider}
    A->>O: Redirect to Provider
    O-->>C: Authorization Page
    C->>O: Approve Access
    O->>A: Callback with Code
    A->>O: Exchange Code for Token
    O-->>A: Access Token
    A->>D: Create/Update User
    A-->>C: Return Session Token
```

## Password Reset Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant D as Database
    participant E as Email Service

    C->>A: POST /api/auth/forgot-password
    A->>D: Verify Email
    A->>E: Send Reset Token
    E-->>C: Reset Email
    C->>A: POST /api/auth/reset-password
    A->>D: Verify Token & Update
    A-->>C: Success Response
```

## MFA Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant D as Database
    participant M as MFA Service

    C->>A: POST /api/auth/login
    A->>D: Verify Credentials
    A->>M: Generate MFA Challenge
    M-->>C: MFA Required
    C->>A: POST /api/auth/mfa/verify
    A->>M: Verify MFA Code
    A-->>C: Session Token
```

## Token Refresh Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant T as Token Service

    C->>A: POST /api/auth/refresh
    A->>T: Validate Refresh Token
    T->>T: Generate New Tokens
    T-->>A: New Token Pair
    A-->>C: Updated Tokens
```

## Session Management

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant D as Database
    participant R as Redis Cache

    C->>A: Any API Request
    A->>R: Check Session
    R-->>A: Session Valid
    A->>D: Process Request
    A-->>C: API Response
```

## Security Considerations

1. **Token Storage**
   - Access tokens stored in memory
   - Refresh tokens in secure HTTP-only cookies
   - Session IDs with appropriate security flags

2. **Token Expiration**
   - Access tokens: 15 minutes
   - Refresh tokens: 7 days
   - Reset tokens: 1 hour

3. **Rate Limiting**
   - Login attempts: 5 per minute
   - Password reset: 3 per hour
   - MFA attempts: 3 per 15 minutes

4. **Security Headers**
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
``` 