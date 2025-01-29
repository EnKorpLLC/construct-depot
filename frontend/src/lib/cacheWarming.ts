import { redis } from './redis';
import { prisma } from './db';
import { trackMetric } from './metrics';
import { logger } from './logger';

interface WarmingConfig {
  batchSize: number;
  concurrency: number;
  retryAttempts: number;
  retryDelay: number;
}

const DEFAULT_CONFIG: WarmingConfig = {
  batchSize: 100,
  concurrency: 5,
  retryAttempts: 3,
  retryDelay: 1000
};

interface CacheableData {
  key: string;
  data: unknown;
  ttl: number;
}

/**
 * Cache warming service for pre-populating Redis cache
 */
export class CacheWarming {
  private config: WarmingConfig;

  constructor(config: Partial<WarmingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Warm frequently accessed product data
   */
  async warmProducts(): Promise<void> {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
        take: this.config.batchSize
      });

      const cacheables: CacheableData[] = products.map(product => ({
        key: `product:${product.id}`,
        data: product,
        ttl: 3600 // 1 hour
      }));

      await this.warmCache(cacheables);
      await trackMetric({ name: 'cache_warming_products', value: products.length });
    } catch (error) {
      logger.error('Failed to warm product cache:', error);
      throw error;
    }
  }

  /**
   * Warm frequently accessed order data
   */
  async warmOrders(): Promise<void> {
    try {
      const orders = await prisma.order.findMany({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] }
        },
        include: {
          items: true,
          shipment: true
        },
        orderBy: { updatedAt: 'desc' },
        take: this.config.batchSize
      });

      const cacheables: CacheableData[] = orders.map(order => ({
        key: `order:${order.id}`,
        data: order,
        ttl: 1800 // 30 minutes
      }));

      await this.warmCache(cacheables);
      await trackMetric({ name: 'cache_warming_orders', value: orders.length });
    } catch (error) {
      logger.error('Failed to warm order cache:', error);
      throw error;
    }
  }

  /**
   * Warm user settings and preferences
   */
  async warmUserSettings(): Promise<void> {
    try {
      const settings = await prisma.orderSettings.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        },
        take: this.config.batchSize
      });

      const cacheables: CacheableData[] = settings.map(setting => ({
        key: `user:settings:${setting.userId}`,
        data: setting,
        ttl: 7200 // 2 hours
      }));

      await this.warmCache(cacheables);
      await trackMetric({ name: 'cache_warming_user_settings', value: settings.length });
    } catch (error) {
      logger.error('Failed to warm user settings cache:', error);
      throw error;
    }
  }

  /**
   * Warm all caches
   */
  async warmAll(): Promise<void> {
    const startTime = Date.now();
    
    try {
      await Promise.all([
        this.warmProducts(),
        this.warmOrders(),
        this.warmUserSettings()
      ]);

      const duration = Date.now() - startTime;
      await trackMetric({ name: 'cache_warming_duration', value: duration });
      logger.info('Cache warming completed successfully', { duration });
    } catch (error) {
      logger.error('Cache warming failed:', error);
      throw error;
    }
  }

  /**
   * Cache data with retry logic
   */
  private async warmCache(items: CacheableData[]): Promise<void> {
    const chunks = this.chunkArray(items, this.config.concurrency);

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async item => {
          for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
              await redis.setex(
                item.key,
                item.ttl,
                JSON.stringify(item.data)
              );
              break;
            } catch (error) {
              if (attempt === this.config.retryAttempts) {
                throw error;
              }
              await this.delay(this.config.retryDelay * attempt);
            }
          }
        })
      );
    }
  }

  /**
   * Split array into chunks for concurrent processing
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 