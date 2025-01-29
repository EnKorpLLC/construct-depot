import { NextRequest, NextResponse } from 'next/server';
import redis from './redis';
import { prisma } from './prisma';

interface MetricData {
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface RequestMetrics {
  path: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metricsPrefix = 'metrics:';
  private requestMetricsKey = 'request_metrics';
  private slowQueryThreshold = 1000; // 1 second

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record a metric
   */
  async recordMetric(name: string, data: MetricData): Promise<void> {
    const key = `${this.metricsPrefix}${name}`;
    const value = JSON.stringify({
      ...data,
      timestamp: data.timestamp || Date.now()
    });

    await redis.zadd(key, data.timestamp, value);
    // Keep only last 24 hours of metrics
    await redis.zremrangebyscore(key, '-inf', Date.now() - 24 * 60 * 60 * 1000);
  }

  /**
   * Record request metrics
   */
  async recordRequest(metrics: RequestMetrics): Promise<void> {
    await this.recordMetric(this.requestMetricsKey, {
      value: metrics.duration,
      timestamp: metrics.timestamp,
      tags: {
        path: metrics.path,
        method: metrics.method,
        statusCode: metrics.statusCode.toString()
      }
    });

    // Record slow requests separately
    if (metrics.duration > this.slowQueryThreshold) {
      await this.recordMetric('slow_requests', {
        value: metrics.duration,
        timestamp: metrics.timestamp,
        tags: {
          path: metrics.path,
          method: metrics.method,
          statusCode: metrics.statusCode.toString()
        }
      });
    }
  }

  /**
   * Get metrics for a time range
   */
  async getMetrics(name: string, start: number, end: number = Date.now()): Promise<MetricData[]> {
    const key = `${this.metricsPrefix}${name}`;
    const data = await redis.zrangebyscore(key, start, end);
    return data.map(item => JSON.parse(item));
  }

  /**
   * Calculate statistics for a metric
   */
  async getStats(name: string, period: number = 3600000): Promise<{
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  }> {
    const start = Date.now() - period;
    const metrics = await this.getMetrics(name, start);
    
    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)]
    };
  }

  /**
   * Monitor database performance
   */
  async monitorDatabase(): Promise<void> {
    const metrics = await prisma.$queryRaw`
      SELECT 
        relname as table_name,
        n_live_tup as row_count,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum
      FROM pg_stat_user_tables;
    `;

    await this.recordMetric('database_stats', {
      value: 1,
      timestamp: Date.now(),
      tags: { metrics: JSON.stringify(metrics) }
    });
  }

  /**
   * Get slow queries
   */
  async getSlowQueries(hours: number = 24): Promise<MetricData[]> {
    const start = Date.now() - hours * 60 * 60 * 1000;
    return this.getMetrics('slow_requests', start);
  }

  /**
   * Clear old metrics
   */
  async cleanup(): Promise<void> {
    const keys = await redis.keys(`${this.metricsPrefix}*`);
    const retention = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const key of keys) {
      await redis.zremrangebyscore(key, '-inf', Date.now() - retention);
    }
  }
}

/**
 * Performance monitoring middleware
 */
export function withPerformanceMonitoring() {
  return async function monitor(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const start = Date.now();
    const monitor = PerformanceMonitor.getInstance();

    try {
      const response = await handler();
      
      // Record request metrics
      await monitor.recordRequest({
        path: new URL(req.url).pathname,
        method: req.method,
        statusCode: response.status,
        duration: Date.now() - start,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      // Record error metrics
      await monitor.recordMetric('errors', {
        value: 1,
        timestamp: Date.now(),
        tags: {
          path: new URL(req.url).pathname,
          method: req.method,
          error: error.message
        }
      });

      throw error;
    }
  };
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Cleanup job
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    performanceMonitor.cleanup().catch(console.error);
  }, 24 * 60 * 60 * 1000); // Run daily
}

// Database monitoring job
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    performanceMonitor.monitorDatabase().catch(console.error);
  }, 15 * 60 * 1000); // Run every 15 minutes
} 