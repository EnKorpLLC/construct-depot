import { Redis } from 'ioredis';

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
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(redisConfig);
      
      // Error handling
      RedisClient.instance.on('error', (error) => {
        console.error('[Redis Error]', error);
      });

      RedisClient.instance.on('connect', () => {
        console.log('[Redis] Connected successfully');
      });

      // Add disconnect handler
      RedisClient.instance.on('end', () => {
        console.log('[Redis] Connection closed');
        RedisClient.instance = null;
      });
    }
    return RedisClient.instance;
  }
}

// Export singleton instance
export const redis = RedisClient.getInstance(); 