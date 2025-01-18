# Deployment Checklist

Last Updated: 2025-01-16 14:00

## Pre-Deployment Checklist

### Infrastructure Setup
- [ ] Neon Database
  - [ ] Create production database in Neon dashboard
  - [ ] Note down the DATABASE_URL
  - [ ] Enable direct connections and note DIRECT_URL
  - [ ] Configure database pooling settings
  - [ ] Set up automated backups

- [ ] Redis Setup
  - [ ] Set up Redis instance (e.g., Redis Cloud, AWS ElastiCache)
  - [ ] Note down the REDIS_URL
  - [ ] Configure persistence settings
  - [ ] Set up monitoring

- [ ] Vercel Setup
  - [ ] Create new project in Vercel
  - [ ] Connect GitHub repository
  - [ ] Configure build settings
  - [ ] Set up custom domain
  - [ ] Enable automatic SSL

### Environment Variables
- [ ] Core Variables
  - [ ] DATABASE_URL (from Neon)
  - [ ] DIRECT_URL (from Neon)
  - [ ] REDIS_URL
  - [ ] NEXTAUTH_SECRET (generate with `openssl rand -base64 32`)
  - [ ] NEXTAUTH_URL (your production domain)
  - [ ] NODE_ENV=production

- [ ] Optional Services
  - [ ] SMTP settings (if using email)
  - [ ] S3 credentials (if using file storage)
  - [ ] Stripe keys (if using payments)
  - [ ] Sentry DSN (if using error tracking)

## Deployment Process

### Automated Steps (via deploy.ps1)
- [ ] Tool verification
- [ ] Environment variable check
- [ ] Database connection test
- [ ] Redis connection test
- [ ] Database migrations
- [ ] Production build

### Manual Steps
- [ ] Domain Configuration
  - [ ] Add custom domain in Vercel
  - [ ] Configure DNS records
  - [ ] Verify SSL certificate
  - [ ] Test domain accessibility

- [ ] Initial Setup
  - [ ] Create super admin account
  - [ ] Configure service settings
  - [ ] Set up email templates
  - [ ] Configure rate limits

- [ ] Security
  - [ ] Enable CORS settings
  - [ ] Configure CSP headers
  - [ ] Set up rate limiting
  - [ ] Enable audit logging

## Post-Deployment Checklist

### Verification
- [ ] Test all authentication flows
- [ ] Verify email functionality
- [ ] Check Redis caching
- [ ] Test database queries
- [ ] Verify file uploads (if applicable)
- [ ] Test payment processing (if applicable)

### Monitoring Setup
- [ ] Configure error tracking
- [ ] Set up performance monitoring
- [ ] Enable database monitoring
- [ ] Configure alerting
- [ ] Set up logging

### Documentation
- [ ] Update API documentation
- [ ] Document deployment configuration
- [ ] Create runbook for common issues
- [ ] Document rollback procedures

## Deployment Commands

```bash
# Run automated deployment
./scripts/deploy.ps1

# Manual database commands if needed
npx prisma migrate deploy
npx prisma generate

# Verify deployment
curl https://your-domain.com/api/health
```

## Rollback Procedures

1. Database:
   ```bash
   npx prisma migrate reset
   npx prisma migrate deploy
   ```

2. Application:
   - Use Vercel dashboard to rollback to previous deployment
   - Verify database compatibility with rolled back version

## Common Issues

1. Database Connection:
   - Check Neon dashboard for connection issues
   - Verify DATABASE_URL and DIRECT_URL
   - Check IP allowlist

2. Redis Connection:
   - Verify REDIS_URL
   - Check Redis instance status
   - Verify network access

3. Build Failures:
   - Check Vercel build logs
   - Verify environment variables
   - Check for dependency issues

## Support Contacts

- Database Issues: Neon Support Dashboard
- Deployment Issues: Vercel Support
- Application Issues: Internal Dev Team 