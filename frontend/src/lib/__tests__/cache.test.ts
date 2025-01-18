import { NextRequest, NextResponse } from 'next/server';
import { withCache, invalidateCache, clearCache, getCacheStats } from '../cache';
import redis from '../redis';

// Mock redis
jest.mock('../redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    setex: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
    flushall: jest.fn(),
    dbsize: jest.fn(),
    info: jest.fn()
  }
}));

describe('Cache Service', () => {
  const mockRedis = redis as jest.Mocked<typeof redis>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENABLE_CACHE = 'true';
  });

  describe('withCache middleware', () => {
    const mockHandler = jest.fn();
    const mockRequest = {
      method: 'GET',
      url: 'http://localhost:3000/api/test',
      headers: new Headers()
    } as unknown as NextRequest;

    beforeEach(() => {
      mockHandler.mockResolvedValue(
        new NextResponse(JSON.stringify({ data: 'test' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should return cached data when available', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ data: 'cached' }));
      
      const middleware = withCache();
      const response = await middleware(mockRequest, mockHandler);
      const data = await response.json();

      expect(data).toEqual({ data: 'cached' });
      expect(response.headers.get('X-Cache')).toBe('HIT');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should cache and return fresh data when cache is empty', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const middleware = withCache();
      const response = await middleware(mockRequest, mockHandler);
      const data = await response.json();

      expect(data).toEqual({ data: 'test' });
      expect(response.headers.get('X-Cache')).toBe('MISS');
      expect(mockHandler).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should bypass cache for non-GET requests', async () => {
      const postRequest = {
        ...mockRequest,
        method: 'POST'
      } as unknown as NextRequest;

      const middleware = withCache();
      await middleware(postRequest, mockHandler);

      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should bypass cache for authenticated requests', async () => {
      const authedRequest = {
        ...mockRequest,
        headers: new Headers({ 'authorization': 'Bearer token' })
      } as unknown as NextRequest;

      const middleware = withCache();
      await middleware(authedRequest, mockHandler);

      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should respect custom cache conditions', async () => {
      const middleware = withCache({
        condition: (req) => req.url.includes('cacheable')
      });

      await middleware(mockRequest, mockHandler);

      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should use custom TTL when provided', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const middleware = withCache({ ttl: 600 });
      await middleware(mockRequest, mockHandler);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.any(String),
        600,
        expect.any(String)
      );
    });
  });

  describe('Cache management functions', () => {
    it('should invalidate cache by pattern', async () => {
      mockRedis.keys.mockResolvedValue(['key1', 'key2']);
      
      await invalidateCache('test:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('test:*');
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2');
    });

    it('should clear entire cache', async () => {
      await clearCache();

      expect(mockRedis.flushall).toHaveBeenCalled();
    });

    it('should return cache statistics', async () => {
      mockRedis.dbsize.mockResolvedValue(100);
      mockRedis.info.mockResolvedValue(`
        used_memory_human:1.00M
        keyspace_hits:1000
        keyspace_misses:100
      `);

      const stats = await getCacheStats();

      expect(stats).toEqual({
        keys: 100,
        memory: '1.00M',
        hits: '1000',
        misses: '100'
      });
    });
  });
}); 