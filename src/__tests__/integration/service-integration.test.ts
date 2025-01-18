import { AdminService } from '@/services/admin';
import { CrawlerService } from '@/services/crawler';
import { EnhancedValidationService } from '@/services/validation';
import { generateCrawlerJob, generateUser } from '../mocks/data-generators';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Service Integration Tests', () => {
  let adminService: AdminService;
  let crawlerService: CrawlerService;
  let validationService: EnhancedValidationService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

    // Reset singleton instances
    // @ts-ignore
    AdminService.instance = undefined;
    // @ts-ignore
    CrawlerService.instance = undefined;
    // @ts-ignore
    EnhancedValidationService.instance = undefined;

    // Initialize services
    adminService = AdminService.getInstance();
    crawlerService = CrawlerService.getInstance();
    validationService = EnhancedValidationService.getInstance();
  });

  describe('Admin and Crawler Integration', () => {
    it('should log crawler activities through admin service', async () => {
      const mockJob = generateCrawlerJob();
      
      // Mock crawler initialization
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJob
      });

      // Mock activity logging
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          activityId: '123'
        })
      });

      // Initialize crawler and verify admin logging
      await crawlerService.initializeCrawler('https://example.com');
      await adminService.logCrawlerAction('START_CRAWLER', mockJob.id);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/api/admin/activities'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('START_CRAWLER')
        })
      );
    });

    it('should validate crawler data before processing', async () => {
      const mockJob = generateCrawlerJob();
      const schema = {
        url: { type: 'string', required: true },
        status: { type: 'string', required: true },
        results: { type: 'array', required: false }
      };

      // Validate crawler job data
      const validationResult = validationService.validateSchema(mockJob, schema);
      expect(validationResult.isValid).toBe(true);

      // Mock crawler status check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJob
      });

      const status = await crawlerService.getCrawlerStatus(mockJob.id);
      expect(status).toEqual(mockJob);
    });
  });

  describe('Admin and Validation Integration', () => {
    it('should validate user data before admin operations', async () => {
      const mockUser = generateUser();
      const userSchema = {
        email: { type: 'email', required: true },
        name: { type: 'string', required: true },
        role: { type: 'string', required: true }
      };

      // Validate user data
      const validationResult = validationService.validateSchema(mockUser, userSchema);
      expect(validationResult.isValid).toBe(true);

      // Mock user creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      // Mock activity logging
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          activityId: '123'
        })
      });

      // Create user and log activity
      await adminService.createUser(mockUser);
      await adminService.logUserAction('CREATE_USER', mockUser.id);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle validation errors in admin operations', async () => {
      const invalidUser = {
        email: 'invalid-email',
        role: 'INVALID_ROLE'
      };

      const userSchema = {
        email: { type: 'email', required: true },
        name: { type: 'string', required: true },
        role: { type: 'string', required: true }
      };

      // Validate invalid user data
      const validationResult = validationService.validateSchema(invalidUser, userSchema);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toHaveLength(3); // Missing name, invalid email, role validation

      // Attempt to create invalid user
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation failed',
          details: validationResult.errors
        })
      });

      await expect(adminService.createUser(invalidUser as any))
        .rejects
        .toThrow('Validation failed');
    });
  });

  describe('Crawler and Validation Integration', () => {
    it('should validate crawler results before processing', async () => {
      const mockJob = generateCrawlerJob();
      const resultSchema = {
        url: { type: 'string', required: true },
        title: { type: 'string', required: true },
        price: { type: 'number', required: true },
        availability: { type: 'string', required: true }
      };

      // Mock crawler results
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockJob,
          results: mockJob.results.map(result => {
            const validationResult = validationService.validateSchema(result, resultSchema);
            expect(validationResult.isValid).toBe(true);
            return result;
          })
        })
      });

      const results = await crawlerService.getCrawlerResults(mockJob.id);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(result => {
        const validationResult = validationService.validateSchema(result, resultSchema);
        expect(validationResult.isValid).toBe(true);
      });
    });

    it('should handle invalid crawler results', async () => {
      const invalidResults = [
        { url: 'https://example.com', title: 'Product' }, // Missing price and availability
        { url: 'https://example.com', price: 'invalid' } // Invalid price type and missing fields
      ];

      const resultSchema = {
        url: { type: 'string', required: true },
        title: { type: 'string', required: true },
        price: { type: 'number', required: true },
        availability: { type: 'string', required: true }
      };

      // Validate each result
      invalidResults.forEach(result => {
        const validationResult = validationService.validateSchema(result, resultSchema);
        expect(validationResult.isValid).toBe(false);
      });

      // Mock crawler results with invalid data
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid result format',
          details: 'Results failed validation'
        })
      });

      await expect(crawlerService.getCrawlerResults('job-id'))
        .rejects
        .toThrow('Invalid result format');
    });
  });

  describe('Full Service Integration', () => {
    it('should handle complete crawler workflow with validation and logging', async () => {
      const mockJob = generateCrawlerJob();
      const mockUser = generateUser({ role: 'ADMIN' });

      // Step 1: Validate user permissions
      const userSchema = {
        role: { type: 'string', required: true, enum: ['ADMIN', 'USER'] }
      };
      
      const userValidation = validationService.validateSchema(mockUser, userSchema);
      expect(userValidation.isValid).toBe(true);

      // Step 2: Initialize crawler
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJob
      });

      const job = await crawlerService.initializeCrawler('https://example.com');
      expect(job.id).toBeDefined();

      // Step 3: Log crawler initialization
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          activityId: '123'
        })
      });

      await adminService.logCrawlerAction('START_CRAWLER', job.id);

      // Step 4: Validate and process results
      const resultSchema = {
        url: { type: 'string', required: true },
        title: { type: 'string', required: true },
        price: { type: 'number', required: true }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockJob,
          results: mockJob.results.map(result => {
            const validationResult = validationService.validateSchema(result, resultSchema);
            expect(validationResult.isValid).toBe(true);
            return result;
          })
        })
      });

      const results = await crawlerService.getCrawlerResults(job.id);
      expect(Array.isArray(results)).toBe(true);

      // Step 5: Log completion
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          activityId: '124'
        })
      });

      await adminService.logCrawlerAction('COMPLETE_CRAWLER', job.id);

      // Verify all interactions
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });
}); 