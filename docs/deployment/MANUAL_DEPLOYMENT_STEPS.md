# Manual Deployment Steps

Last Updated: 2025-01-16 14:00

This guide covers the manual steps required for deploying the Bulk Buyer Group application. These steps should be performed after running the automated deployment script (`deploy.ps1`).

## 1. Neon Database Setup

1. Log into the Neon Console (https://console.neon.tech)
2. Create a new project:
   - Click "New Project"
   - Name: `bulk-buyer-prod`
   - Region: Choose closest to your users
   - Click "Create Project"

3. Get connection details:
   - Copy the provided DATABASE_URL
   - Enable "Pooled connection" and copy DIRECT_URL
   - Save both URLs for environment variables

4. Configure database settings:
   - Set compute size (recommended: at least 0.25 vCPU)
   - Enable auto-scaling if needed
   - Configure backup settings (recommended: daily)

## 2. Redis Setup

1. Choose a Redis provider:
   - Redis Cloud (recommended)
   - AWS ElastiCache
   - Self-hosted Redis

2. For Redis Cloud:
   - Create new subscription
   - Select fixed plan or pay-as-you-go
   - Choose region closest to your database
   - Enable persistence
   - Set memory limit (recommended: start with 1GB)
   - Enable TLS
   - Copy the REDIS_URL

## 3. Vercel Deployment

1. Connect Repository:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select the project

2. Configure Project:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. Environment Variables:
   - Add all variables from the checklist
   - Mark sensitive variables as encrypted
   - Add production-specific variables

4. Domain Setup:
   - Go to Project Settings > Domains
   - Add your custom domain
   - Configure DNS records as instructed
   - Wait for SSL certificate provisioning

## 4. Initial Application Setup

1. Create Super Admin Account:
   ```sql
   -- Connect to your database and run:
   INSERT INTO "User" (
     "email",
     "name",
     "role",
     "password"
   ) VALUES (
     'admin@yourdomain.com',
     'Super Admin',
     'SUPER_ADMIN',
     -- Use hashed password from development environment
   );
   ```

2. Configure Services:
   - Log in as super admin
   - Go to Settings > Services
   - Configure each service:
     - Email (SMTP settings)
     - Analytics
     - Security settings
     - Payment providers

3. Security Settings:
   - Configure rate limiting:
     ```env
     RATE_LIMIT_WINDOW=60000
     RATE_LIMIT_MAX_REQUESTS=100
     ```
   - Set up CORS in `next.config.js`:
     ```js
     async headers() {
       return [
         {
           source: '/api/:path*',
           headers: [
             { key: 'Access-Control-Allow-Credentials', value: 'true' },
             { key: 'Access-Control-Allow-Origin', value: 'your-domain.com' },
             // ... other headers
           ],
         },
       ]
     }
     ```

## 5. Monitoring Setup

1. Error Tracking (Sentry):
   - Create account at sentry.io
   - Create new project
   - Add DSN to environment variables
   - Configure error alerts

2. Performance Monitoring:
   - Set up Vercel Analytics
   - Configure custom metrics
   - Set up alerting thresholds

3. Health Checks:
   - Set up uptime monitoring
   - Configure endpoint monitoring
   - Set up status page

## 6. Post-Deployment Verification

1. Test Authentication:
   ```bash
   # Test login endpoint
   curl -X POST https://your-domain.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

2. Test Health Check:
   ```bash
   curl https://your-domain.com/api/health
   ```

3. Verify Database:
   ```bash
   # Check migrations
   npx prisma migrate status
   ```

4. Test Redis:
   ```bash
   # Via application health check
   curl https://your-domain.com/api/health
   ```

## 7. Backup Verification

1. Database Backups:
   - Verify Neon backup settings
   - Test backup restoration process
   - Document recovery procedures

2. Application State:
   - Verify file storage backups
   - Test restore procedures
   - Document recovery steps

## 8. Documentation Updates

1. Update API Documentation:
   - Update endpoint URLs
   - Document rate limits
   - Update authentication details

2. Create Runbook:
   - Common issues and solutions
   - Deployment rollback steps
   - Emergency contact information

## Support Resources

- Neon Documentation: https://neon.tech/docs
- Vercel Documentation: https://vercel.com/docs
- Redis Documentation: https://redis.io/documentation
- Internal Wiki: [Your Internal Wiki URL]

## Emergency Contacts

- DevOps Team: [Contact Information]
- Database Admin: [Contact Information]
- Security Team: [Contact Information] 