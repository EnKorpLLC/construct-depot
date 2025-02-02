import { analyticsService } from './AnalyticsService';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { TimeFrame } from './types';

jest.mock('@/lib/prisma');
jest.mock('@/lib/redis');

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrderMetrics', () => {
    it('should return cached metrics if available', async () => {
      const mockMetrics = {
        totalOrders: 100,
        pendingOrders: 20,
        completedOrders: 80,
        orderTrends: []
      };

      (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockMetrics));

      const result = await analyticsService.getOrderMetrics('month');

      expect(result).toEqual(mockMetrics);
      expect(redis.get).toHaveBeenCalledWith('analytics:orders:month');
      expect(prisma.order.count).not.toHaveBeenCalled();
    });

    it('should calculate and cache metrics if not cached', async () => {
      (redis.get as jest.Mock).mockResolvedValueOnce(null);
      (prisma.order.count as jest.Mock).mockResolvedValueOnce(100);
      (prisma.order.count as jest.Mock).mockResolvedValueOnce(20);
      (prisma.order.count as jest.Mock).mockResolvedValueOnce(80);
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([]);

      const result = await analyticsService.getOrderMetrics('month');

      expect(result).toEqual({
        totalOrders: 100,
        pendingOrders: 20,
        completedOrders: 80,
        orderTrends: []
      });
      expect(redis.setex).toHaveBeenCalled();
    });
  });

  describe('generateReport', () => {
    it('should create a report job and return report ID', async () => {
      const config = {
        name: 'Test Report',
        type: 'PERFORMANCE',
        timeframe: 'month' as TimeFrame,
        metrics: ['orders'],
        dimensions: ['time'],
        sections: ['orders'],
        filters: {
          from: '2024-01-01',
          to: '2024-01-31'
        },
        format: 'JSON'
      };

      const result = await analyticsService.generateReport(config);

      expect(result).toMatch(/^report_\d+$/);
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('getReportStatus', () => {
    it('should return report status if found', async () => {
      const mockReport = {
        id: 'report_123',
        status: 'COMPLETED',
        results: {}
      };

      (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockReport));

      const result = await analyticsService.getReportStatus('report_123');

      expect(result).toEqual(mockReport);
    });

    it('should throw error if report not found', async () => {
      (redis.get as jest.Mock).mockResolvedValueOnce(null);

      await expect(analyticsService.getReportStatus('report_123'))
        .rejects
        .toThrow('Report not found');
    });
  });
}); 