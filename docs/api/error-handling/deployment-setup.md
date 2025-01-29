# Deployment Setup

Last Updated: 2025-01-21 20:34

# Deployment Setup Guide

## Overview

This document provides information about deployment-setup.


## Prerequisites
- GitHub account with admin access to the repository
- Vercel account
- PostgreSQL database (production)
- Access to all required service accounts (Stripe, PayPal, etc.)

## Environment Setup

### 1. Database Configuration
1. Set up a PostgreSQL database for production
2. Note down the following details:
   - Database URL
   - Database name
   - Username
   - Password

### 2. Vercel Setup
1. Create a new project in Vercel
2. Link it to your GitHub repository
3. Note down the following from Vercel dashboard:
   - Vercel Token
   - Organization ID
   - Project ID

### 3. GitHub Secrets Setup
Add the following secrets to your GitHub repository (Settings > Secrets > Actions):

```bash
# Database
POSTGRES_PASSWORD=your-db-password
DATABASE_URL=postgresql://user:password@host:5432/db_name

# Application
NEXT_PUBLIC_APP_URL=https://your-production-url.com
NEXTAUTH_URL=https://your-production-url.com
NEXTAUTH_SECRET=your-nextauth-secret
NODE_ENV=production

# Deployment
DEPLOY_KEY=your-deploy-key
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# Services
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
TAX_SERVICE_API_KEY=your-tax-service-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
```typescript

### 4. Environment Variables
1. Copy `.env.example` to `.env`
2. Update all variables with appropriate values
3. Ensure all services are properly configured:
   - Payment processing
   - Email service
   - Tax service
   - Monitoring

## Deployment Process

### Automatic Deployment
1. Push changes to the `main` branch
2. GitHub Actions will automatically:
   - Set up the environment
   - Install dependencies
   - Generate Prisma client
   - Run database migrations
   - Build the application
   - Deploy to Vercel

### Manual Deployment
To trigger deployment manually:
1. Go to Actions tab in GitHub
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Select branch and trigger deployment

## Monitoring Deployment

### 1. GitHub Actions
- Monitor the workflow in GitHub Actions tab
- Check build logs for any errors
- Verify all steps complete successfully

### 2. Vercel Dashboard
- Monitor deployment status
- Check build logs
- Verify domain configuration
- Monitor performance metrics

### 3. Database
- Verify migrations are applied
- Check database connections
- Monitor database performance

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check database credentials
   - Ensure database is accessible from Vercel

2. **Build Failures**
   - Check Node.js version
   - Verify all dependencies are installed
   - Check for TypeScript errors

3. **Deployment Failures**
   - Verify Vercel credentials
   - Check project configuration
   - Ensure all required secrets are set

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive values to the repository
   - Rotate secrets periodically
   - Use different values for development/staging/production

2. **Database**
   - Use strong passwords
   - Enable SSL connections
   - Restrict database access

3. **API Keys**
   - Use restricted API keys
   - Implement proper rate limiting
   - Monitor API usage

## Maintenance

1. **Regular Tasks**
   - Monitor error logs
   - Check performance metrics
   - Update dependencies
   - Rotate secrets

2. **Backup Procedures**
   - Database backups
   - Environment configuration backups
   - Code repository backups

3. **Updates**
   - Keep dependencies updated
   - Apply security patches
   - Update Node.js version when needed 