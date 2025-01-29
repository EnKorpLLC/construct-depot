import { AdminService } from '@/services/admin';
import { AdminActivity, AdminActivityAction } from '@/types/admin';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AdminService', () => {
  let adminService: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
    // @ts-ignore - Reset the singleton instance
    AdminService.instance = undefined;
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
      try {
        console.log('Test starting');
        
        // Mock the fetch response
        mockFetch.mockImplementation(async (url) => {
          console.log('Mock fetch called with URL:', url);
          return {
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
          };
        });

        console.log('Calling getActivities with params:', { limit: 10, offset: 0 });
        const result = await adminService.getActivities({
          limit: 10,
          offset: 0
        });

        console.log('getActivities returned:', result);
        
        // Get the actual URL from the mock calls
        const actualUrl = mockFetch.mock.calls[0][0];
        console.log('Actual URL:', actualUrl);
        
        expect(result.activities).toEqual(mockActivities);
        expect(actualUrl).toContain('limit=10');
        expect(actualUrl).toContain('offset=0');
      } catch (error) {
        console.error('Test error:', error);
        throw error;
      }
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
      action: 'CREATE_USER' as AdminActivityAction,
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
      const invalidActivity = {
        action: 'INVALID_ACTION',
        target: '',
        details: {}
      };

      await expect(adminService.createActivity(invalidActivity as any))
        .rejects
        .toThrow();
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

  describe('Error Handling and Edge Cases', () => {
    describe('Permission Errors', () => {
      it('should handle unauthorized access', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden'
        });

        await expect(adminService.getActivities({}))
          .rejects
          .toThrow('Unauthorized access: Forbidden');
      });

      it('should handle expired sessions', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Session Expired'
        });

        await expect(adminService.getActivities({}))
          .rejects
          .toThrow('Session expired: Please login again');
      });
    });

    describe('Network Issues', () => {
      it('should handle timeout errors', async () => {
        mockFetch.mockImplementationOnce(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          )
        );

        await expect(adminService.getActivities({}))
          .rejects
          .toThrow('Request timeout');
      });

      it('should handle network failures', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(adminService.getActivities({}))
          .rejects
          .toThrow('Network error');
      });
    });

    describe('Rate Limiting', () => {
      it('should handle rate limit errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({
            'Retry-After': '60'
          })
        });

        await expect(adminService.getActivities({}))
          .rejects
          .toThrow('Rate limit exceeded: Please try again in 60 seconds');
      });
    });

    describe('Concurrent Requests', () => {
      it('should handle multiple simultaneous requests', async () => {
        const mockResponse = {
          ok: true,
          json: async () => ({
            activities: [],
            pagination: { total: 0, limit: 10, offset: 0, hasMore: false }
          })
        };

        mockFetch.mockResolvedValue(mockResponse);

        const requests = Array(5).fill(null).map(() => 
          adminService.getActivities({})
        );

        await expect(Promise.all(requests)).resolves.toBeDefined();
        expect(mockFetch).toHaveBeenCalledTimes(5);
      });
    });

    describe('Data Validation', () => {
      it('should handle malformed response data', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            activities: [{ 
              id: '1',
              // Missing required fields
            }]
          })
        });

        await expect(adminService.getActivities({}))
          .rejects
          .toThrow('Invalid response format');
      });

      it('should handle empty response data', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => null
        });

        await expect(adminService.getActivities({}))
          .rejects
          .toThrow('Empty response received');
      });
    });
  });
}); 