import { track } from '@vercel/analytics';

export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export async function trackMetric(metric: Metric): Promise<void> {
  try {
    await track(metric.name, {
      value: metric.value,
      ...metric.tags
    });
  } catch (error) {
    console.error('Failed to track metric:', error);
  }
}

export async function getSystemMetrics() {
  return {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: Date.now()
  };
}