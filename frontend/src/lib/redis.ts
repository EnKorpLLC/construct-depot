import Redis from 'ioredis';
import { logger } from './logger';

// Redis configuration with best practices
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  connectTimeout: 15000,
  lazyConnect: true,
  showFriendlyErrorStack: process.env.NODE_ENV !== 'production'
};

// Create Redis singleton instance
class RedisClient {
  private static instance: Redis | undefined;

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        throw new Error('REDIS_URL environment variable is not set');
      }

      try {
        RedisClient.instance = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          }
        });

        RedisClient.instance.on('error', (error) => {
          logger.error('Redis connection error:', error);
        });

        RedisClient.instance.on('connect', () => {
          logger.info('Connected to Redis');
        });
      } catch (error) {
        logger.error('Failed to create Redis instance:', error);
        throw error;
      }
    }

    return RedisClient.instance;
  }

  static disconnect(): void {
    if (RedisClient.instance) {
      RedisClient.instance.disconnect();
      RedisClient.instance = undefined;
    }
  }
}

// Export singleton instance
export const redis = RedisClient.getInstance();

export async function checkRedis(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

export default redis; 