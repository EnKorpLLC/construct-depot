import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor, withPerformanceMonitoring } from '../monitoring';
import redis from '../redis';
import { prisma } from '../prisma';

// Mock dependencies
jest.mock('../redis', () => ({
  __esModule: true,
  default: {
    zadd: jest.fn(),
    zremrangebyscore: jest.fn(),
    zrangebyscore: jest.fn(),
    keys: jest.fn()
  }
}));

jest.mock('../prisma', () => ({
  __esModule: true,
  prisma: {
    $queryRaw: jest.fn()
  }
}));

describe('Performance Monitoring', () => {
  const mockRedis = redis as jest.Mocked<typeof redis>;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Metric Recording', () => {
    it('should record metrics with timestamp', async () => {
      const metricData = {
        value: 100,
        timestamp: Date.now(),
        tags: { type: 'test' }
      };

      await performanceMonitor.recordMetric('test_metric', metricData);

      expect(mockRedis.zadd).toHaveBeenCalledWith(
        'metrics:test_metric',
        metricData.timestamp,
        expect.any(String)
      );
    });

    it('should clean up old metrics', async () => {
      const metricData = {
        value: 100,
        timestamp: Date.now(),
        tags: { type: 'test' }
      };

      await performanceMonitor.recordMetric('test_metric', metricData);

      expect(mockRedis.zremrangebyscore).toHaveBeenCalledWith(
        'metrics:test_metric',
        '-inf',
        expect.any(Number)
      );
    });
  });

  describe('Request Monitoring', () => {
    it('should record request metrics', async () => {
      const metrics = {
        path: '/api/test',
        method: 'GET',
        statusCode: 200,
        duration: 100,
        timestamp: Date.now()
      };

      await performanceMonitor.recordRequest(metrics);

      expect(mockRedis.zadd).toHaveBeenCalledWith(
        'metrics:request_metrics',
        expect.any(Number),
        expect.stringContaining(metrics.path)
      );
    });

    it('should record slow requests separately', async () => {
      const metrics = {
        path: '/api/test',
        method: 'GET',
        statusCode: 200,
        duration: 2000, // Over 1000ms threshold
        timestamp: Date.now()
      };

      await performanceMonitor.recordRequest(metrics);

      expect(mockRedis.zadd).toHaveBeenCalledWith(
        'metrics:slow_requests',
        expect.any(Number),
        expect.stringContaining(metrics.path)
      );
    });
  });

  describe('Metrics Retrieval', () => {
    it('should retrieve metrics for time range', async () => {
      const mockData = [
        JSON.stringify({ value: 100, timestamp: Date.now() }),
        JSON.stringify({ value: 200, timestamp: Date.now() })
      ];
      mockRedis.zrangebyscore.mockResolvedValue(mockData);

      const metrics = await performanceMonitor.getMetrics('test_metric', Date.now() - 3600000);

      expect(metrics).toHaveLength(2);
      expect(metrics[0].value).toBe(100);
      expect(metrics[1].value).toBe(200);
    });

    it('should calculate statistics correctly', async () => {
      const mockData = [
        JSON.stringify({ value: 100, timestamp: Date.now() }),
        JSON.stringify({ value: 200, timestamp: Date.now() }),
        JSON.stringify({ value: 300, timestamp: Date.now() })
      ];
      mockRedis.zrangebyscore.mockResolvedValue(mockData);

      const stats = await performanceMonitor.getStats('test_metric');

      expect(stats).toEqual({
        count: 3,
        avg: 200,
        min: 100,
        max: 300,
        p95: 300,
        p99: 300
      });
    });
  });

  describe('Database Monitoring', () => {
    it('should monitor database performance', async () => {
      const mockDbStats = [
        { table_name: 'users', row_count: 1000 }
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockDbStats);

      await performanceMonitor.monitorDatabase();

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockRedis.zadd).toHaveBeenCalledWith(
        'metrics:database_stats',
        expect.any(Number),
        expect.stringContaining('users')
      );
    });
  });

  describe('Monitoring Middleware', () => {
    const mockRequest = {
      url: 'http://localhost:3000/api/test',
      method: 'GET'
    } as unknown as NextRequest;

    const mockHandler = jest.fn().mockResolvedValue(
      new NextResponse(JSON.stringify({ data: 'test' }), {
        status: 200
      })
    );

    it('should record successful requests', async () => {
      const middleware = withPerformanceMonitoring();
      await middleware(mockRequest, mockHandler);

      expect(mockRedis.zadd).toHaveBeenCalledWith(
        'metrics:request_metrics',
        expect.any(Number),
        expect.stringContaining('/api/test')
      );
    });

    it('should record failed requests', async () => {
      const error = new Error('Test error');
      const failingHandler = jest.fn().mockRejectedValue(error);
      const middleware = withPerformanceMonitoring();

      await expect(middleware(mockRequest, failingHandler)).rejects.toThrow(error);

      expect(mockRedis.zadd).toHaveBeenCalledWith(
        'metrics:errors',
        expect.any(Number),
        expect.stringContaining('Test error')
      );
    });
  });

  describe('Cleanup', () => {
    it('should clean up old metrics', async () => {
      mockRedis.keys.mockResolvedValue(['metrics:test1', 'metrics:test2']);

      await performanceMonitor.cleanup();

      expect(mockRedis.zremrangebyscore).toHaveBeenCalledTimes(2);
      expect(mockRedis.zremrangebyscore).toHaveBeenCalledWith(
        expect.any(String),
        '-inf',
        expect.any(Number)
      );
    });
  });
}); 