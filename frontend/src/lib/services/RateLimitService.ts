import { Redis } from 'ioredis';
import { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  max: number;         // Max requests per window
  message?: string;    // Custom error message
}

export class RateLimitService {
  private static instance: RateLimitService;
  private redis: Redis;

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  public static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  private getKey(identifier: string, action: string): string {
    return `ratelimit:${action}:${identifier}`;
  }

  public async isRateLimited(
    identifier: string,
    action: string,
    config: RateLimitConfig
  ): Promise<{
    limited: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = this.getKey(identifier, action);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean old requests
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const requestCount = await this.redis.zcount(key, windowStart, now);

    if (requestCount >= config.max) {
      const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldestRequest[1] ? parseInt(oldestRequest[1]) + config.windowMs : now + config.windowMs;
      
      return {
        limited: true,
        remaining: 0,
        resetTime,
      };
    }

    // Add current request
    await this.redis.zadd(key, now, `${now}`);
    // Set expiry for cleanup
    await this.redis.expire(key, Math.ceil(config.windowMs / 1000));

    return {
      limited: false,
      remaining: config.max - requestCount - 1,
      resetTime: now + config.windowMs,
    };
  }

  public middleware(config: RateLimitConfig) {
    return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const identifier = req.headers['x-forwarded-for'] as string || 
                        req.socket.remoteAddress || 
                        'unknown';
      
      const action = `${req.method}:${req.url}`;
      
      const { limited, remaining, resetTime } = await this.isRateLimited(
        identifier,
        action,
        config
      );

      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime);

      if (limited) {
        res.status(429).json({
          error: config.message || 'Too many requests, please try again later.',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        });
        return;
      }

      next();
    };
  }
}

// Default configurations
export const authRateLimits = {
  login: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                     // 5 attempts
    message: 'Too many login attempts, please try again later.',
  },
  register: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 3,                     // 3 attempts
    message: 'Too many registration attempts, please try again later.',
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 3,                     // 3 attempts
    message: 'Too many password reset attempts, please try again later.',
  },
  emailVerification: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 5,                     // 5 attempts
    message: 'Too many verification attempts, please try again later.',
  },
}; 