# Setup

Last Updated: 2025-01-21 20:34

# Project Setup Guide

## Overview

This document provides information about setup.


## Prerequisites
- Node.js 18.x or later
- PostgreSQL 14.x or later
- Git
- npm or yarn
- VS Code (recommended)

## Initial Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/bulk-buyer-group.git
cd bulk-buyer-group
```typescript

### 2. Environment Setup
1. Copy the environment template:
```bash
cp .env.example .env.local
```typescript

2. Configure your environment variables:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bulk_buyer_db"
DIRECT_URL="postgresql://user:password@localhost:5432/bulk_buyer_db"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Email Service
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email"
EMAIL_SERVER_PASSWORD="your-password"
EMAIL_FROM="noreply@example.com"

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=60

# Crawler Configuration
CRAWLER_RATE_LIMIT=30
CRAWLER_CONCURRENT_JOBS=5
```typescript

### 3. Database Setup
1. Start PostgreSQL service
2. Create database:
```bash
createdb bulk_buyer_db
```typescript

3. Run migrations:
```bash
npx prisma migrate dev
```typescript

4. Generate Prisma client:
```bash
npx prisma generate
```typescript

5. Seed initial data:
```bash
npx prisma db seed
```typescript

### 4. Install Dependencies
```bash
npm install
# or
yarn install
```typescript

### 5. Start Development Server
```bash
npm run dev
# or
yarn dev
```typescript

## Development Environment

### VS Code Extensions
Install the following extensions:
- Prisma (prisma.prisma)
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense

### Code Style Setup
1. ESLint configuration is provided in `.eslintrc.js`
2. Prettier configuration is in `.prettierrc`
3. TypeScript configuration in `tsconfig.json`

### Git Hooks
1. Install husky:
```bash
npx husky install
```typescript

2. Pre-commit hooks will:
   - Run linting
   - Run type checking
   - Format code
   - Run tests

## Testing Environment

### Setup Test Database
```bash
createdb bulk_buyer_test_db
```typescript

### Configure Test Environment
Create `.env.test.local`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bulk_buyer_test_db"
```typescript

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific tests
npm test -- -t "test-name"
```typescript

## Deployment Setup

### Production Environment
1. Configure production environment variables
2. Run production build:
```bash
npm run build
```typescript

3. Start production server:
```bash
npm start
```typescript

## Troubleshooting

### Common Issues
1. Database Connection
   - Verify PostgreSQL is running
   - Check connection string
   - Verify database exists

2. Prisma Issues
   - Run `npx prisma generate` after schema changes
   - Clear Prisma cache: `rm -rf node_modules/.prisma`

3. Next.js Issues
   - Clear Next.js cache: `rm -rf .next`
   - Verify Node.js version

### Getting Help
1. Check existing issues in GitHub repository
2. Review documentation in `/docs`
3. Contact development team

## Security Considerations
1. Never commit `.env` files
2. Keep dependencies updated
3. Follow security best practices
4. Use environment variables for sensitive data

## Maintenance
1. Regular updates:
   ```bash
   npm update
   ```typescript

2. Database maintenance:
   ```bash
   npx prisma migrate reset # Reset database
   npx prisma db push # Push schema changes
   ```typescript

3. Code maintenance:
   ```bash
   npm run lint
   npm run format
   ``` 