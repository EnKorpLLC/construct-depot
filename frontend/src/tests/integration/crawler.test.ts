import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { CrawlerConfig, CrawlerJob } from '@prisma/client';

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: {
      id: 'test-supplier-id',
      role: 'SUPPLIER'
    }
  }))
}));

describe('Crawler Service Integration Tests', () => {
  let testUser: any;
  let testConfig: CrawlerConfig;
  let testJob: CrawlerJob;

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: await hash('password123', 12),
        role: 'SUPPLIER'
      }
    });

    // Create test crawler config
    testConfig = await prisma.crawlerConfig.create({
      data: {
        name: 'Test Crawler',
        description: 'Test crawler configuration',
        targetUrl: 'https://example.com',
        schedule: '0 0 * * *',
        rateLimit: 60,
        status: 'idle',
        createdBy: testUser.id
      }
    });

    // Create test crawler job
    testJob = await prisma.crawlerJob.create({
      data: {
        configId: testConfig.id,
        status: 'idle',
        pagesProcessed: 0,
        itemsFound: 0,
        errors: []
      }
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.crawlerJob.deleteMany();
    await prisma.crawlerConfig.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Crawler Configuration', () => {
    it('should create a new crawler configuration', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'New Crawler',
          description: 'New crawler configuration',
          targetUrl: 'https://example.com',
          schedule: '0 0 * * *',
          rateLimit: 60
        }
      });

      await expect(
        prisma.crawlerConfig.create({
          data: {
            ...req.body,
            status: 'idle',
            createdBy: testUser.id
          }
        })
      ).resolves.toMatchObject({
        name: 'New Crawler',
        status: 'idle'
      });
    });

    it('should update an existing crawler configuration', async () => {
      const updatedConfig = await prisma.crawlerConfig.update({
        where: { id: testConfig.id },
        data: {
          name: 'Updated Crawler',
          rateLimit: 30
        }
      });

      expect(updatedConfig.name).toBe('Updated Crawler');
      expect(updatedConfig.rateLimit).toBe(30);
    });

    it('should validate crawler configuration', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: '', // Invalid: empty name
          targetUrl: 'not-a-url' // Invalid: not a valid URL
        }
      });

      await expect(
        prisma.crawlerConfig.create({
          data: {
            ...req.body,
            status: 'idle',
            createdBy: testUser.id
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('Crawler Job Execution', () => {
    it('should start a crawler job', async () => {
      const updatedJob = await prisma.crawlerJob.update({
        where: { id: testJob.id },
        data: {
          status: 'running',
          startTime: new Date()
        }
      });

      expect(updatedJob.status).toBe('running');
      expect(updatedJob.startTime).toBeDefined();
    });

    it('should update job progress', async () => {
      const updatedJob = await prisma.crawlerJob.update({
        where: { id: testJob.id },
        data: {
          pagesProcessed: 10,
          itemsFound: 5
        }
      });

      expect(updatedJob.pagesProcessed).toBe(10);
      expect(updatedJob.itemsFound).toBe(5);
    });

    it('should handle job errors', async () => {
      const error = {
        message: 'Test error',
        timestamp: new Date().toISOString(),
        url: 'https://example.com/page'
      };

      const updatedJob = await prisma.crawlerJob.update({
        where: { id: testJob.id },
        data: {
          status: 'failed',
          errors: [error]
        }
      });

      expect(updatedJob.status).toBe('failed');
      expect(updatedJob.errors).toHaveLength(1);
      expect(updatedJob.errors[0]).toMatchObject(error);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const startTime = Date.now();
      const requests = Array(3).fill(null).map(() =>
        prisma.crawlerJob.update({
          where: { id: testJob.id },
          data: { pagesProcessed: { increment: 1 } }
        })
      );

      await Promise.all(requests);
      const duration = Date.now() - startTime;

      // Should take at least 2 seconds for 3 requests with a rate limit of 1 req/sec
      expect(duration).toBeGreaterThanOrEqual(2000);
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed jobs', async () => {
      // First attempt - fail
      await prisma.crawlerJob.update({
        where: { id: testJob.id },
        data: {
          status: 'failed',
          errors: [{
            message: 'Temporary error',
            timestamp: new Date().toISOString(),
            retryable: true
          }]
        }
      });

      // Retry
      const retriedJob = await prisma.crawlerJob.update({
        where: { id: testJob.id },
        data: {
          status: 'running',
          startTime: new Date(),
          errors: []
        }
      });

      expect(retriedJob.status).toBe('running');
      expect(retriedJob.errors).toHaveLength(0);
    });

    it('should handle permanent failures', async () => {
      const error = {
        message: 'Permanent error',
        timestamp: new Date().toISOString(),
        retryable: false
      };

      const failedJob = await prisma.crawlerJob.update({
        where: { id: testJob.id },
        data: {
          status: 'failed',
          errors: [error]
        }
      });

      expect(failedJob.status).toBe('failed');
      expect(failedJob.errors[0].retryable).toBe(false);
    });
  });

  describe('Data Validation', () => {
    it('should validate extracted data', async () => {
      const validData = {
        title: 'Test Product',
        price: 99.99,
        url: 'https://example.com/product'
      };

      const invalidData = {
        title: '', // Invalid: empty title
        price: -1, // Invalid: negative price
        url: 'not-a-url' // Invalid: not a valid URL
      };

      // Valid data should update successfully
      const successJob = await prisma.crawlerJob.update({
        where: { id: testJob.id },
        data: {
          itemsFound: 1,
          status: 'completed'
        }
      });

      expect(successJob.status).toBe('completed');

      // Invalid data should fail validation
      await expect(
        prisma.crawlerJob.update({
          where: { id: testJob.id },
          data: {
            itemsFound: -1 // Invalid: negative count
          }
        })
      ).rejects.toThrow();
    });
  });
}); 