import { execSync } from 'child_process';
import { setupDatabase } from './setup-database';
import { setupRedisCluster, verifyClusterHealth } from './setup-redis-cluster';

async function deploy() {
  try {
    console.log('Starting deployment process...');

    // Pre-deployment checks
    console.log('Running pre-deployment checks...');
    execSync('npm run test', { stdio: 'inherit' });
    execSync('npm audit', { stdio: 'inherit' });
    execSync('npm run verify-codebase', { stdio: 'inherit' });

    // Build application
    console.log('Building application...');
    execSync('npm run build', { stdio: 'inherit' });

    // Database setup
    console.log('Setting up database...');
    await setupDatabase();

    // Redis setup
    console.log('Setting up Redis cluster...');
    await setupRedisCluster();
    await verifyClusterHealth();

    // Deploy application
    console.log('Deploying application...');
    execSync('pm2 deploy production', { stdio: 'inherit' });

    // Post-deployment verification
    console.log('Running post-deployment checks...');
    
    // Health check
    execSync('npm run monitor:health', { stdio: 'inherit' });
    
    // Load test verification
    execSync('npm run test:load:analytics', { stdio: 'inherit' });
    execSync('npm run test:load:orders', { stdio: 'inherit' });
    execSync('npm run test:load:ws', { stdio: 'inherit' });

    // Monitoring setup
    console.log('Setting up monitoring...');
    execSync('npm run setup:monitoring', { stdio: 'inherit' });

    console.log('Deployment completed successfully');
  } catch (error) {
    console.error('Deployment failed:', error);
    
    // Rollback
    console.log('Starting rollback process...');
    try {
      execSync('pm2 deploy production revert', { stdio: 'inherit' });
      console.log('Rollback completed successfully');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    
    process.exit(1);
  }
}

// Deployment verification
async function verifyDeployment() {
  try {
    console.log('Verifying deployment...');

    // Check application health
    const healthCheck = execSync('curl http://localhost:3000/api/health').toString();
    if (!healthCheck.includes('ok')) {
      throw new Error('Health check failed');
    }

    // Verify database connection
    await setupDatabase();

    // Verify Redis cluster
    await verifyClusterHealth();

    // Check monitoring
    execSync('npm run monitor:metrics', { stdio: 'inherit' });

    console.log('Deployment verification completed successfully');
    return true;
  } catch (error) {
    console.error('Deployment verification failed:', error);
    return false;
  }
}

if (require.main === module) {
  deploy().then(() => {
    verifyDeployment().then(success => {
      if (!success) {
        process.exit(1);
      }
    });
  });
}

export { deploy, verifyDeployment }; 