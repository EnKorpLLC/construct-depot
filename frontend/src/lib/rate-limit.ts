import redis from './redis';
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  interval: number; // Time window in seconds
  maxRequests: number; // Maximum requests allowed in the interval
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth:login': { interval: 60, maxRequests: 5 }, // 5 attempts per minute
  'auth:register': { interval: 3600, maxRequests: 3 }, // 3 attempts per hour
  'auth:reset-password': { interval: 3600, maxRequests: 3 }, // 3 attempts per hour
  'auth:verify-email': { interval: 3600, maxRequests: 5 }, // 5 attempts per hour
  'auth:mfa': { interval: 900, maxRequests: 3 }, // 3 attempts per 15 minutes
};

class RateLimiter {
  private static instance: RateLimiter;
  private redis: Redis;

  private constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private getKey(action: string, identifier: string): string {
    return `rate-limit:${action}:${identifier}`;
  }

  public async isRateLimited(
    action: string,
    identifier: string
  ): Promise<boolean> {
    const config = RATE_LIMITS[action];
    if (!config) {
      return false; // No rate limit configured for this action
    }

    const key = this.getKey(action, identifier);
    const current = await this.redis.incr(key);

    // Set expiry on first request
    if (current === 1) {
      await this.redis.expire(key, config.interval);
    }

    return current > config.maxRequests;
  }

  public async getRemainingAttempts(
    action: string,
    identifier: string
  ): Promise<number> {
    const config = RATE_LIMITS[action];
    if (!config) {
      return Infinity;
    }

    const key = this.getKey(action, identifier);
    const current = await this.redis.get(key);
    
    if (!current) {
      return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - parseInt(current));
  }

  public async resetLimit(action: string, identifier: string): Promise<void> {
    const key = this.getKey(action, identifier);
    await this.redis.del(key);
  }
}

export const rateLimiter = RateLimiter.getInstance();

// Middleware factory for rate limiting
export function withRateLimit(action: string) {
  return async function rateLimit(
    req: NextRequest,
    identifier?: string
  ): Promise<{
    limited: boolean;
    remaining: number;
  }> {
    // Use IP address if no identifier provided
    const id = identifier || req.ip || 'unknown';
    
    const [limited, remaining] = await Promise.all([
      rateLimiter.isRateLimited(action, id),
      rateLimiter.getRemainingAttempts(action, id),
    ]);

    return { limited, remaining };
  };
}

// Helper function to get rate limit info
export function getRateLimitConfig(action: string): RateLimitConfig | undefined {
  return RATE_LIMITS[action];
} 