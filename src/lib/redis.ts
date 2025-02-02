import { Redis } from 'ioredis';

const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV === 'development';

// In test environment, use a mock Redis
// In development, use local Redis or Upstash Redis
// In production, require proper credentials
let redisInstance: Redis;

if (isTest) {
  redisInstance = new Redis({
    host: 'localhost',
    port: 6379,
  });
} else {
  // Development and Production environments
  if (!process.env.KV_URL) {
    throw new Error('Redis URL (KV_URL) is not configured');
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