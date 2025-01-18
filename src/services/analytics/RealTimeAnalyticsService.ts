import { WebSocket } from 'ws';
import { redis } from '@/lib/redis';
import { performanceMonitor } from '@/lib/monitoring';
import { analyticsService } from './AnalyticsService';

interface RealTimeMetrics {
  activeUsers: number;
  currentOrders: number;
  revenueToday: number;
  orderRate: number;
}

export class RealTimeAnalyticsService {
  private static instance: RealTimeAnalyticsService;
  private metrics: RealTimeMetrics = {
    activeUsers: 0,
    currentOrders: 0,
    revenueToday: 0,
    orderRate: 0
  };
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_TTL = 60; // 1 minute
  private readonly UPDATE_INTERVAL = 5000; // 5 seconds

  private constructor() {
    this.startMetricsUpdate();
  }

  public static getInstance(): RealTimeAnalyticsService {
    if (!RealTimeAnalyticsService.instance) {
      RealTimeAnalyticsService.instance = new RealTimeAnalyticsService();
    }
    return RealTimeAnalyticsService.instance;
  }

  public async trackUserActivity(userId: string) {
    const key = `active_users:${new Date().toISOString().split('T')[0]}`;
    await redis.sadd(key, userId);
    await redis.expire(key, 24 * 60 * 60); // Expire after 24 hours
    await this.updateActiveUsers();
  }

  public async trackOrder(orderId: string, amount: number) {
    const today = new Date().toISOString().split('T')[0];
    const orderKey = `orders:${today}`;
    const revenueKey = `revenue:${today}`;

    await Promise.all([
      redis.incr(orderKey),
      redis.incrby(revenueKey, Math.round(amount * 100))
    ]);

    await this.updateMetrics();
  }

  public async getRealtimeMetrics(): Promise<RealTimeMetrics> {
    const cachedMetrics = await redis.get('realtime_metrics');
    if (cachedMetrics) {
      return JSON.parse(cachedMetrics);
    }
    return this.metrics;
  }

  private async updateMetrics() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [activeUsers, currentOrders, revenueToday] = await Promise.all([
        redis.scard(`active_users:${today}`),
        redis.get(`orders:${today}`),
        redis.get(`revenue:${today}`)
      ]);

      // Calculate order rate (orders per minute)
      const orderRate = await this.calculateOrderRate();

      this.metrics = {
        activeUsers: activeUsers || 0,
        currentOrders: parseInt(currentOrders || '0'),
        revenueToday: parseInt(revenueToday || '0') / 100,
        orderRate
      };

      // Cache the metrics
      await redis.setex(
        'realtime_metrics',
        this.CACHE_TTL,
        JSON.stringify(this.metrics)
      );

      // Emit metrics through WebSocket
      this.broadcastMetrics();

      // Log metrics for monitoring
      performanceMonitor.logMetrics('realtime_analytics', this.metrics);
    } catch (error) {
      console.error('Error updating real-time metrics:', error);
      performanceMonitor.logError('realtime_analytics', error);
    }
  }

  private async calculateOrderRate(): Promise<number> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    const recentOrders = await redis.zcount(
      'order_timestamps',
      oneMinuteAgo.getTime(),
      now.getTime()
    );

    return recentOrders;
  }

  private startMetricsUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(
      () => this.updateMetrics(),
      this.UPDATE_INTERVAL
    );
  }

  private async updateActiveUsers() {
    const today = new Date().toISOString().split('T')[0];
    const activeUsers = await redis.scard(`active_users:${today}`);
    this.metrics.activeUsers = activeUsers;
    await this.updateMetrics();
  }

  private broadcastMetrics() {
    // This will be implemented in the WebSocket service
    global.wss?.clients?.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'ANALYTICS_UPDATE',
          data: this.metrics
        }));
      }
    });
  }

  public cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const realTimeAnalytics = RealTimeAnalyticsService.getInstance();
export default realTimeAnalytics; 