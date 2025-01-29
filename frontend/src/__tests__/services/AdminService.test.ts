import { AdminService } from '@/services/admin';
import { AdminActivity } from '@/types/admin';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AdminService', () => {
  let adminService: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    adminService = AdminService.getInstance();
  });

  describe('getActivities', () => {
    const mockActivities: AdminActivity[] = [
      {
        id: '1',
        adminId: 'admin-1',
        adminName: 'John Admin',
        action: 'CREATE_USER',
        target: 'user/123',
        timestamp: new Date(),
        details: { userId: '123' }
      }
    ];

    it('should fetch activities with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          activities: mockActivities,
          pagination: {
            total: 1,
            limit: 10,
            offset: 0,
            hasMore: false
          }
        })
      });

      const result = await adminService.getActivities({
        limit: 10,
        offset: 0
      });

      expect(result.activities).toEqual(mockActivities);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/activities?limit=10&offset=0')
      );
    });

    it('should handle filtering parameters correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          activities: mockActivities,
          pagination: { total: 1, limit: 10, offset: 0, hasMore: false }
        })
      });

      await adminService.getActivities({
        action: 'CREATE_USER',
        adminId: 'admin-1',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('action=CREATE_USER')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('adminId=admin-1')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2024-01-01')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('endDate=2024-01-31')
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });

      await expect(adminService.getActivities({}))
        .rejects
        .toThrow('Failed to fetch activities: Internal Server Error');
    });
  });

  describe('createActivity', () => {
    const mockActivity = {
      action: 'CREATE_USER' as const,
      target: 'user/123',
      details: { userId: '123' }
    };

    it('should create activity successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '1',
          ...mockActivity,
          adminId: 'admin-1',
          adminName: 'John Admin',
          timestamp: new Date()
        })
      });

      const result = await adminService.createActivity(mockActivity);

      expect(result.action).toBe(mockActivity.action);
      expect(result.target).toBe(mockActivity.target);
      expect(result.details).toEqual(mockActivity.details);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/activities'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockActivity)
        })
      );
    });

    it('should handle validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

      await expect(adminService.createActivity({
        action: 'INVALID_ACTION' as any,
        target: ''
      })).rejects.toThrow();
    });
  });

  describe('Activity Logging Methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });
    });

    it('should log config changes', async () => {
      await adminService.logConfigChange('system/settings', { theme: 'dark' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            action: 'SYSTEM_CONFIG',
            target: 'system/settings',
            details: { theme: 'dark' }
          })
        })
      );
    });

    it('should log crawler actions', async () => {
      await adminService.logCrawlerAction('START_CRAWLER', 'crawler/123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            action: 'START_CRAWLER',
            target: 'crawler/123'
          })
        })
      );
    });

    it('should log order actions', async () => {
      await adminService.logOrderAction('APPROVE_ORDER', 'order-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            action: 'APPROVE_ORDER',
            target: 'order/order-123'
          })
        })
      );
    });

    it('should log user actions', async () => {
      await adminService.logUserAction('UPDATE_USER', 'user-123', { role: 'ADMIN' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            action: 'UPDATE_USER',
            target: 'user/user-123',
            details: { role: 'ADMIN' }
          })
        })
      );
    });

    it('should log product actions', async () => {
      await adminService.logProductAction('CREATE_PRODUCT', 'prod-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            action: 'CREATE_PRODUCT',
            target: 'product/prod-123'
          })
        })
      );
    });
  });
}); 