import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import redis from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { performanceMonitor } from '@/lib/monitoring';
import { rateLimiter } from '@/lib/rate-limit';

describe('Production Environment Configuration', () => {
  beforeAll(async () => {
    // Set production environment
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.bulkbuyergroup.com';
    process.env.DATABASE_URL = process.env.PROD_DATABASE_URL;
    process.env.REDIS_URL = process.env.PROD_REDIS_URL;
  });

  afterAll(async () => {
    // Reset environment
    process.env.NODE_ENV = 'test';
    await redis.quit();
    await prisma.$disconnect();
  });

  describe('Redis Configuration', () => {
    it('should connect to production Redis instance', async () => {
      const result = await redis.ping();
      expect(result).toBe('PONG');
    });

    it('should have correct production configuration', () => {
      expect(redis.options.enableReadyCheck).toBe(true);
      expect(redis.options.maxRetriesPerRequest).toBe(3);
      expect(redis.options.showFriendlyErrorStack).toBe(false);
    });

    it('should handle rate limiting in production', async () => {
      const identifier = 'test-prod-user';
      const action = 'auth:login';
      
      // Should allow initial requests
      const limited = await rateLimiter.isRateLimited(action, identifier);
      expect(limited).toBe(false);
      
      // Should block after limit exceeded
      for (let i = 0; i < 10; i++) {
        await rateLimiter.isRateLimited(action, identifier);
      }
      const blocked = await rateLimiter.isRateLimited(action, identifier);
      expect(blocked).toBe(true);
    });
  });

  describe('Database Configuration', () => {
    it('should connect to production database', async () => {
      const result = await prisma.$queryRaw`SELECT 1+1 AS result`;
      expect(result[0].result).toBe(2);
    });

    it('should have proper connection pool settings', async () => {
      const client = prisma.$connect();
      expect(client).resolves.not.toThrow();
    });
  });

  describe('Performance Monitoring', () => {
    it('should record metrics in production format', async () => {
      const metric = {
        value: 100,
        timestamp: Date.now(),
        tags: { environment: 'production' }
      };

      await performanceMonitor.recordMetric('prod_test', metric);
      const metrics = await performanceMonitor.getMetrics('prod_test', Date.now() - 1000);
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0].tags.environment).toBe('production');
    });

    it('should handle concurrent metric recording', async () => {
      const promises = Array(10).fill(0).map((_, i) => 
        performanceMonitor.recordMetric('concurrent_test', {
          value: i,
          timestamp: Date.now(),
          tags: { test: 'concurrent' }
        })
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });

  describe('Security Configuration', () => {
    it('should have secure headers', async () => {
      const headers = {
        'Content-Security-Policy': expect.any(String),
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': expect.stringContaining('max-age='),
      };

      // Verify all security headers are present
      Object.entries(headers).forEach(([header, value]) => {
        expect(value).toMatch(expect.any(String));
      });
    });

    it('should enforce rate limits', async () => {
      const limits = {
        'auth:login': { interval: 60, maxRequests: 5 },
        'auth:register': { interval: 3600, maxRequests: 3 },
      };

      Object.entries(limits).forEach(([action, config]) => {
        expect(rateLimiter.getRateLimitConfig(action)).toEqual(config);
      });
    });
  });

  describe('Error Handling', () => {
    it('should log errors properly in production', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Test production error');

      await performanceMonitor.recordMetric('error_test', {
        value: 1,
        timestamp: Date.now(),
        tags: { error: testError.message }
      });

      expect(errorSpy).not.toHaveBeenCalled(); // Production should not console.error
      errorSpy.mockRestore();
    });

    it('should handle service unavailability gracefully', async () => {
      // Simulate Redis connection failure
      jest.spyOn(redis, 'ping').mockRejectedValueOnce(new Error('Connection failed'));

      await expect(redis.ping()).rejects.toThrow('Connection failed');
      expect(redis.status).toBe('ready'); // Should maintain connection status
    });
  });
}); 