import { prisma } from './db';
import { redis } from './redis';

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeUsers: number;
  responseTime: number;
  uptime: number;
  errorRate: number;
}

interface MetricData {
  name: string;
  value: number;
  timestamp?: number;
}

export async function trackMetric(data: MetricData): Promise<void> {
  const timestamp = data.timestamp || Date.now();
  await redis.hset(`metrics:${data.name}`, {
    value: data.value,
    timestamp
  });
}

class MetricsService {
  private static instance: MetricsService;
  private startTime: number;

  private constructor() {
    this.startTime = Date.now();
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const [
      cpuUsage,
      memoryUsage,
      diskUsage,
      activeUsers,
      responseTime,
      errorRate
    ] = await Promise.all([
      this.getCPUUsage(),
      this.getMemoryUsage(),
      this.getDiskUsage(),
      this.getActiveUsers(),
      this.getAverageResponseTime(),
      this.getErrorRate()
    ]);

    return {
      cpuUsage,
      memoryUsage,
      diskUsage,
      activeUsers,
      responseTime,
      uptime: this.getUptime(),
      errorRate
    };
  }

  private async getCPUUsage(): Promise<number> {
    // Implement actual CPU monitoring
    return Math.random() * 100;
  }

  private async getMemoryUsage(): Promise<number> {
    const used = process.memoryUsage();
    return (used.heapUsed / used.heapTotal) * 100;
  }

  private async getDiskUsage(): Promise<number> {
    // Implement actual disk monitoring
    return Math.random() * 100;
  }

  private async getActiveUsers(): Promise<number> {
    try {
      const activeUsers = await redis.get('active_users');
      return parseInt(activeUsers || '0', 10);
    } catch (error) {
      console.error('Error getting active users:', error);
      return 0;
    }
  }

  private async getAverageResponseTime(): Promise<number> {
    try {
      const responseTime = await redis.get('avg_response_time');
      return parseFloat(responseTime || '0');
    } catch (error) {
      console.error('Error getting average response time:', error);
      return 0;
    }
  }

  private async getErrorRate(): Promise<number> {
    try {
      const errors = await redis.get('error_count');
      const requests = await redis.get('request_count');
      const errorCount = parseInt(errors || '0', 10);
      const requestCount = parseInt(requests || '1', 10);
      return (errorCount / requestCount) * 100;
    } catch (error) {
      console.error('Error getting error rate:', error);
      return 0;
    }
  }

  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

export const metricsService = MetricsService.getInstance();
export const getSystemMetrics = () => metricsService.getSystemMetrics();
export default metricsService; 