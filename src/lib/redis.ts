import { Redis } from 'ioredis';

const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV === 'development';

// In test environment, use a mock Redis
// In development, use local Redis
// In production, require proper credentials
let redisInstance: Redis;

if (isTest || isDev) {
  redisInstance = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: 1, // Reduce retries in development
    lazyConnect: true, // Don't fail immediately if Redis is not available
    retryStrategy() {
      // Don't retry in development
      return null;
    },
    showFriendlyErrorStack: true
  });

  // Add error handler that doesn't crash the app in development
  redisInstance.on('error', (error) => {
    console.warn('Redis connection error (non-critical in development):', error.message);
  });
} else {
  // Production environment
  if (!process.env.KV_URL) {
    throw new Error('Redis URL (KV_URL) is not configured in production');
  }
  
  try {
    redisInstance = new Redis(process.env.KV_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Add error handler
    redisInstance.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  } catch (error) {
    console.error('Failed to initialize Redis connection:', error);
    throw error;
  }
}

export const redis = redisInstance; 