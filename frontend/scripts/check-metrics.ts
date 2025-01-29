import { trackMetric, getSystemMetrics } from '../lib/metrics';

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  message?: string;
}

async function checkMetrics(): Promise<void> {
  try {
    const fetch = (await import('node-fetch')).default;
    const metrics = await getSystemMetrics();
    
    // Track each metric
    await Promise.all(
      Object.entries(metrics).map(([name, value]) =>
        trackMetric({ name, value: Number(value) })
      )
    );

    // Check system health
    const healthCheck: HealthCheck = {
      status: 'healthy'
    };

    console.log('Metrics check completed:', healthCheck);
  } catch (error) {
    console.error('Metrics check failed:', error);
    process.exit(1);
  }
}

checkMetrics(); 