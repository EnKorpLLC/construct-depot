import fetch from 'node-fetch';
import { trackMetric, getSystemMetrics } from '../lib/metrics';

interface HealthCheck {
  status: string;
  timestamp: string;
  services: {
    database: boolean;
    redis: boolean;
    api: boolean;
  };
  metrics: {
    memory: NodeJS.MemoryUsage;
    uptime: number;
    timestamp: number;
  };
}

async function checkMetrics() {
  console.log('Checking system metrics...');
  
  try {
    // Check health endpoint
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const health = await healthResponse.json() as HealthCheck;
    
    console.log('\nHealth Check Results:');
    console.log('--------------------');
    console.log(`Status: ${health.status}`);
    console.log(`Timestamp: ${health.timestamp}`);
    console.log('\nServices:');
    Object.entries(health.services).forEach(([service, status]) => {
      console.log(`- ${service}: ${status ? '✓' : '✗'}`);
    });
    
    // Check system metrics
    const metrics = await getSystemMetrics();
    
    console.log('\nSystem Metrics:');
    console.log('--------------');
    console.log('Memory Usage:');
    Object.entries(metrics.memory).forEach(([type, bytes]) => {
      console.log(`- ${type}: ${(bytes / 1024 / 1024).toFixed(2)} MB`);
    });
    console.log(`Uptime: ${(metrics.uptime / 60).toFixed(2)} minutes`);
    
    // Track custom metric for monitoring check
    await trackMetric({
      name: 'monitoring_check',
      value: 1,
      tags: {
        status: health.status,
        services: Object.entries(health.services)
          .filter(([, status]) => status)
          .map(([service]) => service)
          .join(',')
      }
    });
    
    console.log('\n✓ Metrics check completed successfully');
    
    // Exit with error if any service is down
    const failedServices = Object.entries(health.services)
      .filter(([, status]) => !status)
      .map(([service]) => service);
    
    if (failedServices.length > 0) {
      console.error(`\n⚠️ Failed services: ${failedServices.join(', ')}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Failed to check metrics:', error);
    process.exit(1);
  }
}

// Run metrics check
checkMetrics(); 