import { NextRequest } from 'next/server';
import { rateLimiter, withRateLimit, getRateLimitConfig } from '../rate-limit';
import redis from '../redis';

// Mock redis
jest.mock('../redis', () => ({
  __esModule: true,
  default: {
    incr: jest.fn(),
    expire: jest.fn(),
    get: jest.fn(),
    del: jest.fn()
  }
}));

describe('Rate Limiter', () => {
  const mockRedis = redis as jest.Mocked<typeof redis>;
  const testAction = 'auth:login';
  const testIdentifier = '127.0.0.1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate limiting checks', () => {
    it('should allow requests within limit', async () => {
      mockRedis.incr.mockResolvedValue(3); // Below limit of 5

      const limited = await rateLimiter.isRateLimited(testAction, testIdentifier);

      expect(limited).toBe(false);
      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining(`rate-limit:${testAction}:${testIdentifier}`)
      );
    });

    it('should block requests over limit', async () => {
      mockRedis.incr.mockResolvedValue(6); // Over limit of 5

      const limited = await rateLimiter.isRateLimited(testAction, testIdentifier);

      expect(limited).toBe(true);
    });

    it('should set expiry on first request', async () => {
      mockRedis.incr.mockResolvedValue(1);

      await rateLimiter.isRateLimited(testAction, testIdentifier);

      expect(mockRedis.expire).toHaveBeenCalledWith(
        expect.stringContaining(`rate-limit:${testAction}:${testIdentifier}`),
        60 // Login limit interval is 60 seconds
      );
    });

    it('should not set expiry on subsequent requests', async () => {
      mockRedis.incr.mockResolvedValue(2);

      await rateLimiter.isRateLimited(testAction, testIdentifier);

      expect(mockRedis.expire).not.toHaveBeenCalled();
    });
  });

  describe('Remaining attempts', () => {
    it('should return correct remaining attempts', async () => {
      mockRedis.get.mockResolvedValue('2');

      const remaining = await rateLimiter.getRemainingAttempts(testAction, testIdentifier);

      expect(remaining).toBe(3); // 5 max - 2 used = 3 remaining
    });

    it('should return max attempts when no requests made', async () => {
      mockRedis.get.mockResolvedValue(null);

      const remaining = await rateLimiter.getRemainingAttempts(testAction, testIdentifier);

      expect(remaining).toBe(5); // Max attempts for login
    });

    it('should return 0 when over limit', async () => {
      mockRedis.get.mockResolvedValue('6');

      const remaining = await rateLimiter.getRemainingAttempts(testAction, testIdentifier);

      expect(remaining).toBe(0);
    });
  });

  describe('Rate limit reset', () => {
    it('should reset rate limit counter', async () => {
      await rateLimiter.resetLimit(testAction, testIdentifier);

      expect(mockRedis.del).toHaveBeenCalledWith(
        expect.stringContaining(`rate-limit:${testAction}:${testIdentifier}`)
      );
    });
  });

  describe('withRateLimit middleware', () => {
    const mockRequest = {
      ip: '127.0.0.1',
      method: 'POST',
      url: 'http://localhost:3000/api/auth/login'
    } as unknown as NextRequest;

    it('should return rate limit status and remaining attempts', async () => {
      mockRedis.incr.mockResolvedValue(2);
      mockRedis.get.mockResolvedValue('2');

      const middleware = withRateLimit(testAction);
      const result = await middleware(mockRequest);

      expect(result).toEqual({
        limited: false,
        remaining: 3
      });
    });

    it('should use IP address when no identifier provided', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue('1');

      const middleware = withRateLimit(testAction);
      await middleware(mockRequest);

      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining(mockRequest.ip)
      );
    });

    it('should use custom identifier when provided', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue('1');

      const middleware = withRateLimit(testAction);
      await middleware(mockRequest, 'custom-id');

      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringContaining('custom-id')
      );
    });
  });

  describe('Rate limit configuration', () => {
    it('should return configuration for known action', () => {
      const config = getRateLimitConfig('auth:login');

      expect(config).toEqual({
        interval: 60,
        maxRequests: 5
      });
    });

    it('should return undefined for unknown action', () => {
      const config = getRateLimitConfig('unknown:action');

      expect(config).toBeUndefined();
    });
  });
}); 