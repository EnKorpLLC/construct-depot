# Configuration

Last Updated: 2025-01-21 20:34

# Configuration Guide

## Overview

This guide covers configuration management and environment setup for the Construct Depot platform.

## Environment Variables

### Core Configuration
```env
# Application
NODE_ENV="development"
PORT=3000

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/constructdepot"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/constructdepot"

# Redis
REDIS_HOST="172.17.0.2"
REDIS_PORT="6379"
```typescript

### Optional Configuration
```env
# Email (optional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""

# S3 Storage (optional)
S3_BUCKET=""
S3_REGION=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""

# Monitoring (optional)
SENTRY_DSN=""
```typescript

## Configuration Files

### 1. Next.js Config
```typescript
// next.config.js
module.exports = {
  // Configuration options
  env: {
    customKey: process.env.customKey
  },
  // ... other options
};
```typescript

### 2. TypeScript Config
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "module": "commonjs",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```typescript

### 3. ESLint Config
```javascript
// eslint.config.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    // Custom rules
  }
};
```typescript

## Development Setup

### 1. Local Environment
```bash
# Copy environment template
cp .env.example .env.local

# Update variables
nano .env.local

# Verify configuration
npm run verify:env
```typescript

### 2. IDE Configuration
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```typescript

### 3. Git Configuration
```bash
# Configure Git
git config core.autocrlf false
git config core.eol lf
```typescript

## Best Practices

### 1. Environment Management
- Use .env.local for local overrides
- Never commit sensitive data
- Document all variables
- Use strong secrets

### 2. Security
- Rotate secrets regularly
- Use encryption for sensitive data
- Implement proper access controls
- Monitor for vulnerabilities

### 3. Maintenance
- Review configurations regularly
- Update dependencies
- Monitor for deprecations
- Document changes

## Common Issues

### 1. Environment Variables
- Missing variables
- Invalid formats
- Wrong permissions
- Path issues

### 2. Build Configuration
- Module resolution
- Path aliases
- Dependency conflicts
- TypeScript errors

### 3. IDE Integration
- Extension conflicts
- Format on save issues
- Debug configuration
- Path resolution

## Verification

### 1. Environment Check
```bash
# Verify environment
npm run verify:env

# Check configuration
npm run verify:config

# Test build
npm run build
```typescript

### 2. Security Check
```bash
# Audit dependencies
npm audit

# Check for vulnerabilities
npm run security:check

# Verify secrets
npm run verify:secrets
```typescript

## Resources

- [Next.js Configuration](https://nextjs.org/docs/app/api-reference/next-config-js)
- [TypeScript Configuration](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
- [Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables) 