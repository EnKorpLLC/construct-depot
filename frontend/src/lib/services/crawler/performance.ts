import { Redis } from 'ioredis';
import { performanceMonitor } from '@/lib/monitoring';

interface CrawlerMetrics {
  requestsPerSecond: number;
  successRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  activeJobs: number;
}

class CrawlerPerformance {
  private static instance: CrawlerPerformance;
  private redis: Redis;
  private readonly metricsPrefix = 'crawler:metrics:';
  private readonly jobStatsPrefix = 'crawler:job:';

  private constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  public static getInstance(): CrawlerPerformance {
    if (!CrawlerPerformance.instance) {
      CrawlerPerformance.instance = new CrawlerPerformance();
    }
    return CrawlerPerformance.instance;
  }

  /**
   * Record crawler metrics
   */
  public async recordMetrics(jobId: string, metrics: Partial<CrawlerMetrics>): Promise<void> {
    const timestamp = Date.now();
    const key = `${this.metricsPrefix}${jobId}`;
    
    await this.redis.zadd(key, timestamp, JSON.stringify({
      ...metrics,
      timestamp
    }));

    // Keep only last hour of metrics
    await this.redis.zremrangebyscore(key, '-inf', timestamp - 3600000);

    // Record in monitoring system
    await performanceMonitor.recordMetric('crawler_performance', {
      value: metrics.requestsPerSecond || 0,
      timestamp,
      tags: {
        jobId,
        ...metrics
      }
    });
  }

  /**
   * Get crawler metrics for a specific job
   */
  public async getJobMetrics(jobId: string, period: number = 3600000): Promise<CrawlerMetrics[]> {
    const key = `${this.metricsPrefix}${jobId}`;
    const start = Date.now() - period;
    const data = await this.redis.zrangebyscore(key, start, '+inf');
    return data.map(item => JSON.parse(item));
  }

  /**
   * Optimize request concurrency based on performance
   */
  public async optimizeConcurrency(jobId: string): Promise<number> {
    const metrics = await this.getJobMetrics(jobId, 300000); // Last 5 minutes
    if (metrics.length === 0) return 5; // Default concurrency

    const latestMetrics = metrics[metrics.length - 1];
    const successRate = latestMetrics.successRate || 1;
    const responseTime = latestMetrics.averageResponseTime || 1000;

    // Adjust concurrency based on success rate and response time
    let concurrency = 5;
    if (successRate > 0.95 && responseTime < 500) {
      concurrency = 10;
    } else if (successRate < 0.8 || responseTime > 2000) {
      concurrency = 3;
    }

    return concurrency;
  }

  /**
   * Manage memory usage
   */
  public async manageMemory(jobId: string): Promise<void> {
    const metrics = await this.getJobMetrics(jobId, 60000); // Last minute
    if (metrics.length === 0) return;

    const memoryUsage = metrics[metrics.length - 1].memoryUsage;
    if (memoryUsage > 80) { // Memory usage > 80%
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Clear job-specific caches
      const cacheKey = `${this.jobStatsPrefix}${jobId}:cache`;
      await this.redis.del(cacheKey);
    }
  }

  /**
   * Calculate optimal delay between requests
   */
  public async calculateOptimalDelay(jobId: string): Promise<number> {
    const metrics = await this.getJobMetrics(jobId, 300000); // Last 5 minutes
    if (metrics.length === 0) return 1000; // Default delay

    const latestMetrics = metrics[metrics.length - 1];
    const successRate = latestMetrics.successRate || 1;
    const responseTime = latestMetrics.averageResponseTime || 1000;

    // Adjust delay based on success rate and response time
    let delay = 1000; // Default 1 second
    if (successRate < 0.8) {
      delay = 2000; // Increase delay if high failure rate
    } else if (responseTime > 2000) {
      delay = 1500; // Increase delay if slow responses
    } else if (successRate > 0.95 && responseTime < 500) {
      delay = 500; // Decrease delay if everything is good
    }

    return delay;
  }

  /**
   * Check if rate limit is being approached
   */
  public async checkRateLimit(jobId: string): Promise<boolean> {
    const metrics = await this.getJobMetrics(jobId, 60000); // Last minute
    if (metrics.length === 0) return false;

    const requestsPerSecond = metrics.reduce((sum, m) => sum + (m.requestsPerSecond || 0), 0) / metrics.length;
    return requestsPerSecond > 0.8; // Return true if using more than 80% of rate limit
  }

  /**
   * Get performance recommendations
   */
  public async getRecommendations(jobId: string): Promise<string[]> {
    const metrics = await this.getJobMetrics(jobId, 3600000); // Last hour
    if (metrics.length === 0) return [];

    const recommendations: string[] = [];
    const latest = metrics[metrics.length - 1];

    if (latest.successRate < 0.8) {
      recommendations.push('Consider increasing request delay');
      recommendations.push('Check target site response times');
    }

    if (latest.memoryUsage > 70) {
      recommendations.push('Consider implementing pagination');
      recommendations.push('Review data storage strategy');
    }

    if (latest.requestsPerSecond > 0.8) {
      recommendations.push('Approaching rate limit, consider adjusting schedule');
    }

    return recommendations;
  }
}

export const crawlerPerformance = CrawlerPerformance.getInstance(); 