import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { performanceMonitor } from '@/lib/monitoring';
import { 
  OrderMetricsData,
  CustomerMetricsData,
  RevenueMetricsData,
  PoolMetricsData,
  TimeFrame,
  AnalyticsReport,
  ReportConfig
} from './types';

export class AnalyticsService {
  private static instance: AnalyticsService;
  private readonly CACHE_TTL = 300; // 5 minutes

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Order Analytics
  public async getOrderMetrics(timeframe: TimeFrame): Promise<OrderMetricsData> {
    try {
      const cacheKey = `analytics:orders:${timeframe}`;
      console.log(`Attempting to get order metrics for timeframe: ${timeframe}`);
      
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('Returning cached order metrics');
        return JSON.parse(cached);
      }

      console.log('Cache miss, calculating order metrics');
      const dateRange = this.getDateRange(timeframe);
      
      const [totalOrders, pendingOrders, completedOrders, orderTrends] = await Promise.all([
        prisma.order.count({
          where: { createdAt: { gte: dateRange.start, lte: dateRange.end } }
        }),
        prisma.order.count({
          where: { 
            status: 'PENDING',
            createdAt: { gte: dateRange.start, lte: dateRange.end }
          }
        }),
        prisma.order.count({
          where: { 
            status: 'COMPLETED',
            createdAt: { gte: dateRange.start, lte: dateRange.end }
          }
        }),
        this.getOrderTrends(dateRange.start, dateRange.end)
      ]);

      const metrics = {
        totalOrders,
        pendingOrders,
        completedOrders,
        orderTrends
      };

      console.log('Caching order metrics');
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(metrics));
      return metrics;
    } catch (error) {
      console.error('Error in getOrderMetrics:', {
        error: error.message,
        stack: error.stack,
        timeframe
      });
      throw error;
    }
  }

  // Customer Analytics
  public async getCustomerMetrics(timeframe: TimeFrame): Promise<CustomerMetricsData> {
    const cacheKey = `analytics:customers:${timeframe}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const dateRange = this.getDateRange(timeframe);
    
    const [totalCustomers, newCustomers, customerSegments, topCategories] = await Promise.all([
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      this.getCustomerSegments(dateRange.start, dateRange.end),
      this.getTopCategories(dateRange.start, dateRange.end)
    ]);

    const repeatRate = await this.calculateRepeatPurchaseRate(dateRange.start, dateRange.end);
    const averageOrdersPerCustomer = await this.calculateAverageOrdersPerCustomer(dateRange.start, dateRange.end);

    const metrics = {
      totalCustomers,
      newCustomers,
      repeatRate,
      averageOrdersPerCustomer,
      customerSegments,
      topCategories
    };

    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(metrics));
    return metrics;
  }

  // Revenue Analytics
  public async getRevenueMetrics(timeframe: TimeFrame): Promise<RevenueMetricsData> {
    const cacheKey = `analytics:revenue:${timeframe}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const dateRange = this.getDateRange(timeframe);
    
    const [totalRevenue, averageOrderValue, revenueGrowth, revenueTrends] = await Promise.all([
      this.calculateTotalRevenue(dateRange.start, dateRange.end),
      this.calculateAverageOrderValue(dateRange.start, dateRange.end),
      this.calculateRevenueGrowth(dateRange.start, dateRange.end),
      this.getRevenueTrends(dateRange.start, dateRange.end)
    ]);

    const metrics = {
      totalRevenue,
      averageOrderValue,
      revenueGrowth,
      revenueTrends
    };

    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(metrics));
    return metrics;
  }

  // Report Generation
  public async generateReport(config: ReportConfig): Promise<string> {
    const reportId = await this.createReportJob(config);
    this.processReportInBackground(reportId, config);
    return reportId;
  }

  public async getReportStatus(reportId: string): Promise<AnalyticsReport> {
    const report = await redis.get(`report:${reportId}`);
    if (!report) throw new Error('Report not found');
    return JSON.parse(report);
  }

  // Private Helper Methods
  private getDateRange(timeframe: TimeFrame) {
    const end = new Date();
    let start = new Date();

    switch (timeframe) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        throw new Error('Invalid timeframe');
    }

    return { start, end };
  }

  private async getOrderTrends(start: Date, end: Date) {
    return prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders
      FROM orders
      WHERE created_at BETWEEN ${start} AND ${end}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
  }

  private async getCustomerSegments(start: Date, end: Date) {
    const segments = await prisma.$queryRaw`
      WITH CustomerOrders AS (
        SELECT 
          user_id,
          COUNT(*) as order_count,
          SUM(total_amount) as total_spent
        FROM orders
        WHERE created_at BETWEEN ${start} AND ${end}
        GROUP BY user_id
      )
      SELECT
        CASE
          WHEN total_spent >= 10000 THEN 'VIP'
          WHEN total_spent >= 5000 THEN 'Premium'
          WHEN total_spent >= 1000 THEN 'Regular'
          ELSE 'New'
        END as name,
        COUNT(*) as value
      FROM CustomerOrders
      GROUP BY 
        CASE
          WHEN total_spent >= 10000 THEN 'VIP'
          WHEN total_spent >= 5000 THEN 'Premium'
          WHEN total_spent >= 1000 THEN 'Regular'
          ELSE 'New'
        END
      ORDER BY value DESC
    `;
    return segments;
  }

  private async getTopCategories(start: Date, end: Date) {
    return prisma.$queryRaw`
      SELECT 
        c.name as category,
        COUNT(DISTINCT o.id) as orders,
        SUM(o.total_amount) as revenue
      FROM categories c
      JOIN products p ON p.category_id = c.id
      JOIN order_items oi ON oi.product_id = p.id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN ${start} AND ${end}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
      LIMIT 5
    `;
  }

  private async calculateRepeatPurchaseRate(start: Date, end: Date): Promise<number> {
    const result = await prisma.$queryRaw`
      WITH CustomerPurchases AS (
        SELECT 
          user_id,
          COUNT(*) as purchase_count
        FROM orders
        WHERE created_at BETWEEN ${start} AND ${end}
        GROUP BY user_id
      )
      SELECT 
        ROUND(
          (COUNT(CASE WHEN purchase_count > 1 THEN 1 END)::FLOAT / 
          COUNT(*)::FLOAT) * 100,
          2
        ) as repeat_rate
      FROM CustomerPurchases
    `;
    return result[0].repeat_rate;
  }

  private async calculateAverageOrdersPerCustomer(start: Date, end: Date): Promise<number> {
    const result = await prisma.$queryRaw`
      SELECT 
        ROUND(
          COUNT(*)::FLOAT / 
          COUNT(DISTINCT user_id)::FLOAT,
          2
        ) as avg_orders
      FROM orders
      WHERE created_at BETWEEN ${start} AND ${end}
    `;
    return result[0].avg_orders;
  }

  private async calculateTotalRevenue(start: Date, end: Date): Promise<number> {
    const result = await prisma.order.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
        status: 'COMPLETED'
      },
      _sum: {
        totalAmount: true
      }
    });
    return result._sum.totalAmount || 0;
  }

  private async calculateAverageOrderValue(start: Date, end: Date): Promise<number> {
    const result = await prisma.$queryRaw`
      SELECT 
        ROUND(
          AVG(total_amount)::NUMERIC,
          2
        ) as avg_value
      FROM orders
      WHERE 
        created_at BETWEEN ${start} AND ${end}
        AND status = 'COMPLETED'
    `;
    return result[0].avg_value;
  }

  private async calculateRevenueGrowth(start: Date, end: Date): Promise<number> {
    const previousStart = new Date(start);
    const previousEnd = new Date(end);
    const timespan = end.getTime() - start.getTime();
    
    previousStart.setTime(previousStart.getTime() - timespan);
    previousEnd.setTime(previousEnd.getTime() - timespan);

    const [currentRevenue, previousRevenue] = await Promise.all([
      this.calculateTotalRevenue(start, end),
      this.calculateTotalRevenue(previousStart, previousEnd)
    ]);

    if (previousRevenue === 0) return 100;
    return Number(((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(2));
  }

  private async getRevenueTrends(start: Date, end: Date) {
    return prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        SUM(total_amount) as revenue,
        ROUND(AVG(total_amount)::NUMERIC, 2) as average_order
      FROM orders
      WHERE 
        created_at BETWEEN ${start} AND ${end}
        AND status = 'COMPLETED'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
  }

  private async createReportJob(config: ReportConfig): Promise<string> {
    const reportId = `report_${Date.now()}`;
    await redis.set(`report:${reportId}`, JSON.stringify({
      id: reportId,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
      config
    }));
    return reportId;
  }

  private async processReportInBackground(reportId: string, config: ReportConfig) {
    try {
      const dateRange = {
        start: new Date(config.filters.from),
        end: new Date(config.filters.to)
      };

      const results: any = {
        summary: {},
        timeline: []
      };

      // Collect metrics based on configuration
      if (config.metrics.includes('orders')) {
        const orderMetrics = await this.getOrderMetrics('month');
        results.summary.orders = orderMetrics.totalOrders;
      }

      if (config.metrics.includes('revenue')) {
        const revenueMetrics = await this.getRevenueMetrics('month');
        results.summary.revenue = revenueMetrics.totalRevenue;
      }

      if (config.metrics.includes('customers')) {
        const customerMetrics = await this.getCustomerMetrics('month');
        results.summary.customers = customerMetrics.totalCustomers;
      }

      // Generate timeline data if time dimension is requested
      if (config.dimensions.includes('time')) {
        results.timeline = await this.getRevenueTrends(dateRange.start, dateRange.end);
      }

      // Update report status
      await redis.set(`report:${reportId}`, JSON.stringify({
        id: reportId,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        config,
        results
      }));
    } catch (error) {
      console.error('Report processing error:', error);
      await redis.set(`report:${reportId}`, JSON.stringify({
        id: reportId,
        status: 'FAILED',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        config,
        error: error.message
      }));
    }
  }

  // Invalidate cache when new data is added
  public async invalidateCache(type: 'orders' | 'customers' | 'revenue' | 'all') {
    const keys = [];
    const timeframes: TimeFrame[] = ['week', 'month', 'year'];

    if (type === 'all') {
      keys.push(
        ...timeframes.map(t => `analytics:orders:${t}`),
        ...timeframes.map(t => `analytics:customers:${t}`),
        ...timeframes.map(t => `analytics:revenue:${t}`)
      );
    } else {
      keys.push(...timeframes.map(t => `analytics:${type}:${t}`));
    }

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();
export default analyticsService; 