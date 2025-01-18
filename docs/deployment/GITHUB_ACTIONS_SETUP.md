# GitHub Actions Deployment Setup

Last Updated: 2024-01-17

This guide explains how to set up GitHub Actions for automated deployment of the Bulk Buyer Group application.

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

## Setting Up Secrets

1. Go to your GitHub repository
2. Click "Settings" tab
3. In the left sidebar, click "Secrets and variables" > "Actions"
4. Click "New repository secret"
5. Add each secret:
   - Name: Use the exact names listed above
   - Value: Paste the corresponding value
   - Click "Add secret"

## Environment Setup

1. In GitHub repository:
   - Go to Settings > Environments
   - Click "New environment"
   - Name it "production"
   - Add any required protection rules

2. In Vercel:
   - Ensure your repository is connected
   - Configure build settings
   - Set up environment variables

## Workflow File

The workflow file (.github/workflows/deploy.yml) is already configured to:
1. Validate all required secrets
2. Set up Node.js environment
3. Install dependencies
4. Generate Prisma client
5. Run database migrations
6. Build the application
7. Deploy to Vercel

## Troubleshooting

### Common Issues

1. "Context access might be invalid"
   - Check if all secrets are properly set
   - Verify secret names match exactly
   - Ensure environment "production" exists

2. Vercel deployment fails
   - Verify Vercel token has correct permissions
   - Check if project ID is correct
   - Ensure organization ID matches

3. Database migration fails
   - Verify DATABASE_URL is correct
   - Check if database is accessible
   - Review migration logs

## Monitoring Deployments

1. View deployments:
   - Go to repository "Actions" tab
   - Click on "Deploy to Production" workflow
   - Monitor build and deployment progress

2. Vercel deployments:
   - Check Vercel dashboard
   - Review build logs
   - Monitor deployment status

## Security Notes

- Never commit secrets to the repository
- Rotate secrets periodically
- Use environment protection rules
- Review access to secrets regularly 