# GITHUB ACTIONS SETUP

Last Updated: 2025-01-21 20:34

# GitHub Actions Deployment Setup

Last Updated: 2024-01-19

This guide explains how to set up and monitor GitHub Actions for automated deployment of the Bulk Buyer Group application.

## Overview

This document provides information about GITHUB_ACTIONS_SETUP.


## Required Secrets

You must set up the following secrets in your GitHub repository:

### Core Application Secrets

1. **DATABASE_URL**
   - Get from Neon Dashboard
   - Format: `postgresql://user:password@host/database`
   - Location: Neon Console > Project > Connection Details

2. **REDIS_URL**
   - Get from Redis Cloud Dashboard
   - Format: `redis://default:password@host:port`
   - Location: Redis Cloud > Database > Connect

3. **NEXTAUTH_URL**
   - Value: `https://app.constructdepot.com`
   - Used for authentication callbacks

4. **NEXTAUTH_SECRET**
   - Generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'));"`
   - Used to encrypt session data

### Vercel Deployment Secrets

5. **VERCEL_TOKEN**
   - Get from Vercel Dashboard
   - Location: Vercel > Settings > Tokens > Create Token
   - Permissions needed: Full Account access

6. **VERCEL_ORG_ID**
   - Get from Vercel Dashboard
   - Location: Vercel > Settings > General > Your ID

7. **VERCEL_PROJECT_ID**
   - Get from Vercel Dashboard
   - Location: Project Settings > Project ID

## Workflow Configuration

The deployment workflow (.github/workflows/deploy.yml) is configured with enhanced error handling and CI optimizations:

### Key Features
- Strict secret validation
- Optimized npm installation for CI
- Explicit error handling for critical steps
- Production environment configuration
- Database migration safety checks

### Installation Process
The workflow uses a specialized npm installation process:
```bash
# Clear existing cache and modules
npm cache clean --force
rm -rf node_modules package-lock.json

# Install with CI optimizations
npm install --no-audit --no-fund --no-optional

# Install required dev dependencies
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss postcss autoprefixer
```typescript

## Monitoring Deployments

### Real-time Monitoring
1. Access the GitHub repository
2. Go to the "Actions" tab
3. Look for the most recent "Deploy to Production" workflow run
4. Monitor each step in real-time:
   - ✓ Green check: Step completed successfully
   - ⚠️ Yellow pending: Step in progress
   - ❌ Red X: Step failed

### Critical Points to Monitor
1. **Dependency Installation**
   - Watch for npm installation errors
   - Verify all dependencies are resolved
   - Check for TypeScript compilation issues

2. **Database Operations**
   - Monitor Prisma client generation
   - Watch database migration execution
   - Verify connection success

3. **Build Process**
   - Check for build errors
   - Verify environment variable loading
   - Monitor TypeScript compilation

4. **Vercel Deployment**
   - Verify deployment initiation
   - Monitor build progress
   - Check final deployment status

### Error Response Protocol
If errors occur during deployment:

1. **Immediate Actions**
   - Screenshot or copy the error message
   - Note which step failed
   - Check the full logs for context

2. **Common Issues and Solutions**
   - npm installation failures:
     - Check package.json for conflicts
     - Verify Node.js version compatibility
     - Clear npm cache and retry
   
   - Database migration failures:
     - Verify DATABASE_URL is correct
     - Check database accessibility
     - Review migration files
   
   - Build failures:
     - Check for TypeScript errors
     - Verify environment variables
     - Review dependency versions

3. **Recovery Steps**
   - Fix identified issues
   - Push changes to trigger new deployment
   - Monitor new deployment closely

### Post-Deployment Verification
After successful deployment:
1. Visit the production URL
2. Test critical functionality
3. Verify database connections
4. Check Redis connectivity
5. Monitor error logs

## Security Notes
- Never commit secrets to the repository
- Rotate secrets periodically
- Use environment protection rules
- Review access to secrets regularly
- Monitor deployment logs for sensitive information exposure

## Troubleshooting
For detailed troubleshooting steps, refer to the DEPLOYMENT_CHECKLIST.md file. 