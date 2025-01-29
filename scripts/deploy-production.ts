import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function deployProduction(): Promise<void> {
  console.log('Starting production deployment process...');

  try {
    // Pre-deployment checks
    await checkEnvironmentVariables();
    await validateConfigurations();
    await runTests();

    // Build and deploy
    console.log('\nBuilding application...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('\nRunning database migrations...');
    execSync('npm run db:migrate', { stdio: 'inherit' });

    console.log('\nUpdating environment...');
    execSync('cp .env.production .env', { stdio: 'inherit' });

    console.log('\nDeploying to production...');
    execSync('docker-compose -f docker-compose.prod.yml up -d', { stdio: 'inherit' });

    // Post-deployment verification
    await runHealthChecks();

    console.log('\nDeployment completed successfully!');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

async function checkEnvironmentVariables(): Promise<void> {
  console.log('\nChecking environment variables...');
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'API_URL',
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET'
  ];

  const missingVars = requiredVars.filter(
    varName => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

async function validateConfigurations(): Promise<void> {
  console.log('\nValidating configurations...');
  const configPath = path.join(process.cwd(), 'config', 'production', 'default.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error('Production configuration file not found');
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  if (!config.security || !config.monitoring || !config.scaling) {
    throw new Error('Missing critical configuration sections');
  }
}

async function runTests(): Promise<void> {
  console.log('\nRunning verification suite...');
  execSync('npm run verify:full', { stdio: 'inherit' });
}

async function runHealthChecks(): Promise<void> {
  console.log('\nRunning health checks...');
  // Add health check implementation
  // - API endpoints
  // - Database connection
  // - Cache connection
  // - Monitoring systems
}

deployProduction().catch(console.error); 