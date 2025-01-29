import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Monitoring setup configuration
const MONITORING_CONFIG = {
  sentry: {
    packages: ['@sentry/nextjs'],
    configFiles: ['sentry.client.config.ts', 'sentry.server.config.ts']
  },
  vercel: {
    analytics: true,
    speedInsights: true
  },
  healthCheck: {
    endpoints: ['/api/health', '/api/status']
  }
};

// Install required packages
function installDependencies() {
  console.log('Installing monitoring dependencies...');
  
  try {
    // Install Sentry
    execSync(`npm install ${MONITORING_CONFIG.sentry.packages.join(' ')} --save`);
    execSync('npx @sentry/wizard@latest -i nextjs');
    
    console.log('✓ Dependencies installed successfully');
  } catch (error) {
    console.error('Failed to install dependencies:', error);
    process.exit(1);
  }
}

// Configure Sentry
function configureSentry() {
  console.log('Configuring Sentry...');
  
  const sentryConfig = `
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ tracing: true }),
  ],
});`;

  try {
    MONITORING_CONFIG.sentry.configFiles.forEach(file => {
      fs.writeFileSync(path.join(process.cwd(), file), sentryConfig);
    });
    
    console.log('✓ Sentry configured successfully');
  } catch (error) {
    console.error('Failed to configure Sentry:', error);
    process.exit(1);
  }
}

// Set up health check endpoints
function setupHealthChecks() {
  console.log('Setting up health check endpoints...');
  
  const healthCheckCode = `
import { NextResponse } from 'next/server';
import { checkDatabase } from '@/lib/db';
import { checkRedis } from '@/lib/redis';
import { getSystemMetrics } from '@/lib/metrics';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      api: true
    },
    metrics: await getSystemMetrics()
  };
  
  return NextResponse.json(health);
}`;

  try {
    const healthCheckDir = path.join(process.cwd(), 'app/api/health');
    fs.mkdirSync(healthCheckDir, { recursive: true });
    fs.writeFileSync(path.join(healthCheckDir, 'route.ts'), healthCheckCode);
    
    console.log('✓ Health check endpoints configured');
  } catch (error) {
    console.error('Failed to set up health checks:', error);
    process.exit(1);
  }
}

// Configure custom metrics
function setupCustomMetrics() {
  console.log('Setting up custom metrics...');
  
  const metricsCode = `
import { trackCustomMetric } from '@vercel/analytics';

export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export async function trackMetric(metric: Metric) {
  try {
    await trackCustomMetric(metric.name, metric.value, metric.tags);
    return true;
  } catch (error) {
    console.error('Failed to track metric:', error);
    return false;
  }
}

export async function getSystemMetrics() {
  return {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: Date.now()
  };
}`;

  try {
    const metricsDir = path.join(process.cwd(), 'lib');
    fs.mkdirSync(metricsDir, { recursive: true });
    fs.writeFileSync(path.join(metricsDir, 'metrics.ts'), metricsCode);
    
    console.log('✓ Custom metrics configured');
  } catch (error) {
    console.error('Failed to set up custom metrics:', error);
    process.exit(1);
  }
}

// Main setup function
async function setupMonitoring() {
  console.log('Starting monitoring setup...');
  
  try {
    installDependencies();
    configureSentry();
    setupHealthChecks();
    setupCustomMetrics();
    
    console.log('✓ Monitoring setup completed successfully');
  } catch (error) {
    console.error('Monitoring setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupMonitoring(); 