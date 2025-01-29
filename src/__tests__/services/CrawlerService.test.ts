import { CrawlerService } from '@/lib/services/CrawlerService';
import { createTestClient } from '@/lib/test-utils';
import { mockProxy } from '@/lib/test-utils/proxy';
import { PrismaClient } from '@prisma/client';

describe('CrawlerService', () => {
  let prisma: PrismaClient;
  let crawlerService: CrawlerService;

  beforeAll(async () => {
    prisma = createTestClient();
    crawlerService = new CrawlerService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.crawlerJob.deleteMany();
    await prisma.crawlerConfig.deleteMany();
  });

  describe('Configuration', () => {
    it('should create crawler configuration', async () => {
      const config = await crawlerService.createConfig({
        name: 'Test Crawler',
        description: 'Test crawler configuration',
        targetUrl: 'https://example.com',
        rateLimit: 30,
        schedule: '0 0 * * *',
        createdBy: 'test-user'
      });

      expect(config).toBeDefined();
      expect(config.name).toBe('Test Crawler');
      expect(config.status).toBe('idle');
    });

    it('should validate rate limits', async () => {
      await expect(
        crawlerService.createConfig({
          name: 'Invalid Crawler',
          description: 'Test crawler',
          targetUrl: 'https://example.com',
          rateLimit: 1000, // Too high
          schedule: '0 0 * * *',
          createdBy: 'test-user'
        })
      ).rejects.toThrow('Rate limit too high');
    });
  });

  describe('Job Management', () => {
    let config;

    beforeEach(async () => {
      config = await crawlerService.createConfig({
        name: 'Test Crawler',
        description: 'Test crawler',
        targetUrl: 'https://example.com',
        rateLimit: 30,
        schedule: '0 0 * * *',
        createdBy: 'test-user'
      });
    });

    it('should create and start crawler job', async () => {
      const job = await crawlerService.startJob(config.id);

      expect(job).toBeDefined();
      expect(job.status).toBe('running');
      expect(job.startTime).toBeDefined();
      expect(job.endTime).toBeNull();
    });

    it('should handle job completion', async () => {
      const job = await crawlerService.startJob(config.id);
      await crawlerService.completeJob(job.id, {
        pagesProcessed: 10,
        itemsFound: 50
      });

      const updatedJob = await prisma.crawlerJob.findUnique({
        where: { id: job.id }
      });

      expect(updatedJob.status).toBe('completed');
      expect(updatedJob.endTime).toBeDefined();
      expect(updatedJob.pagesProcessed).toBe(10);
      expect(updatedJob.itemsFound).toBe(50);
    });

    it('should handle job failures', async () => {
      const job = await crawlerService.startJob(config.id);
      const error = new Error('Test error');
      
      await crawlerService.failJob(job.id, error);

      const updatedJob = await prisma.crawlerJob.findUnique({
        where: { id: job.id }
      });

      expect(updatedJob.status).toBe('failed');
      expect(updatedJob.endTime).toBeDefined();
      expect(updatedJob.errors).toContainEqual({
        message: error.message,
        timestamp: expect.any(String)
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const config = await crawlerService.createConfig({
        name: 'Rate Limited Crawler',
        description: 'Test rate limiting',
        targetUrl: 'https://example.com',
        rateLimit: 2, // 2 requests per minute
        schedule: '0 0 * * *',
        createdBy: 'test-user'
      });

      const job = await crawlerService.startJob(config.id);
      
      const start = Date.now();
      await crawlerService.processUrl('https://example.com/1', job.id);
      await crawlerService.processUrl('https://example.com/2', job.id);
      await crawlerService.processUrl('https://example.com/3', job.id);
      const duration = Date.now() - start;

      // Should take at least 60 seconds for 3 requests at 2 req/min
      expect(duration).toBeGreaterThanOrEqual(60000);
    });
  });

  describe('Proxy Support', () => {
    it('should use proxy for requests', async () => {
      const proxyUrl = 'http://proxy.example.com:8080';
      mockProxy.setProxy(proxyUrl);

      const config = await crawlerService.createConfig({
        name: 'Proxy Crawler',
        description: 'Test proxy support',
        targetUrl: 'https://example.com',
        rateLimit: 30,
        schedule: '0 0 * * *',
        createdBy: 'test-user'
      });

      const job = await crawlerService.startJob(config.id);
      await crawlerService.processUrl('https://example.com', job.id);

      expect(mockProxy.getLastProxy()).toBe(proxyUrl);
    });

    it('should rotate proxies', async () => {
      const proxies = [
        'http://proxy1.example.com:8080',
        'http://proxy2.example.com:8080'
      ];
      mockProxy.setProxies(proxies);

      const config = await crawlerService.createConfig({
        name: 'Proxy Rotation Crawler',
        description: 'Test proxy rotation',
        targetUrl: 'https://example.com',
        rateLimit: 30,
        schedule: '0 0 * * *',
        createdBy: 'test-user'
      });

      const job = await crawlerService.startJob(config.id);
      
      await crawlerService.processUrl('https://example.com/1', job.id);
      await crawlerService.processUrl('https://example.com/2', job.id);

      const usedProxies = mockProxy.getUsedProxies();
      expect(usedProxies).toEqual(expect.arrayContaining(proxies));
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed requests', async () => {
      const config = await crawlerService.createConfig({
        name: 'Retry Crawler',
        description: 'Test retry mechanism',
        targetUrl: 'https://example.com',
        rateLimit: 30,
        schedule: '0 0 * * *',
        createdBy: 'test-user'
      });

      const job = await crawlerService.startJob(config.id);
      
      // Mock a temporary failure
      mockProxy.simulateFailure('https://example.com', 2); // Fail twice

      await crawlerService.processUrl('https://example.com', job.id);

      const updatedJob = await prisma.crawlerJob.findUnique({
        where: { id: job.id }
      });

      expect(updatedJob.status).toBe('running');
      expect(mockProxy.getRetryCount('https://example.com')).toBe(2);
    });

    it('should quarantine consistently failing URLs', async () => {
      const config = await crawlerService.createConfig({
        name: 'Quarantine Crawler',
        description: 'Test quarantine system',
        targetUrl: 'https://example.com',
        rateLimit: 30,
        schedule: '0 0 * * *',
        createdBy: 'test-user'
      });

      const job = await crawlerService.startJob(config.id);
      
      // Mock permanent failure
      mockProxy.simulateFailure('https://example.com', 5); // Fail 5 times

      await crawlerService.processUrl('https://example.com', job.id);

      const updatedJob = await prisma.crawlerJob.findUnique({
        where: { id: job.id }
      });

      expect(updatedJob.errors).toContainEqual({
        url: 'https://example.com',
        status: 'quarantined',
        retries: 5,
        message: expect.any(String)
      });
    });
  });
}); 