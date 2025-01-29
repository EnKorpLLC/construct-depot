import { CrawlerService } from '@/services/crawler';
import { CrawlerConfig, CrawlerJob, AuthType, CrawlerStatus } from '@/types/crawler';
import { RateLimiter } from '@/services/crawler/utils/RateLimiter';
import { AuthManager } from '@/services/crawler/utils/AuthManager';
import { ImageProcessor } from '@/services/crawler/utils/ImageProcessor';
import { ProductMatcher } from '@/services/crawler/utils/ProductMatcher';
import { CacheManager } from '@/services/crawler/utils/CacheManager';
import { ConcurrentCrawler } from '@/services/crawler/utils/ConcurrentCrawler';
import prisma from '@/lib/prisma';

// Mock dependencies
jest.mock('@/services/crawler/utils/RateLimiter');
jest.mock('@/services/crawler/utils/AuthManager');
jest.mock('@/services/crawler/utils/ImageProcessor');
jest.mock('@/services/crawler/utils/ProductMatcher');
jest.mock('@/services/crawler/utils/CacheManager');
jest.mock('@/services/crawler/utils/ConcurrentCrawler');
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    crawlerJob: {
      update: jest.fn(),
    },
    crawlerJobLog: {
      create: jest.fn(),
    },
    product: {
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setViewport: jest.fn(),
      setUserAgent: jest.fn(),
      goto: jest.fn(),
      url: jest.fn(),
      $: jest.fn(),
      waitForNavigation: jest.fn(),
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
}));

describe('CrawlerService', () => {
  let crawlerService: CrawlerService;
  let mockConfig: CrawlerConfig;
  let mockJob: CrawlerJob;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock config
    mockConfig = {
      id: 'test-config',
      name: 'Test Crawler',
      description: 'Test crawler configuration',
      targetUrl: 'https://test.com',
      rateLimit: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'idle',
      createdBy: 'test-user',
      authType: AuthType.NONE,
      selectors: {
        listPage: {
          productContainer: '.product',
          nextPage: '.next',
        },
        productPage: {
          name: '.name',
          sku: '.sku',
          price: '.price',
          description: '.description',
          category: '.category',
          images: '.image',
        },
      },
      options: {
        useHeadlessBrowser: true,
        followPagination: true,
        maxPages: 10,
        timeout: 30000,
        retryAttempts: 3,
        downloadImages: true,
        updateFrequency: 'daily',
      },
    };

    // Create mock job
    mockJob = {
      id: 'test-job',
      configId: 'test-config',
      startTime: new Date(),
      status: 'idle' as CrawlerStatus,
      pagesProcessed: 0,
      itemsFound: 0,
      errors: [],
      progress: 0,
      successRate: 100,
      config: mockConfig,
    };

    // Initialize crawler service
    crawlerService = new CrawlerService(mockConfig, mockJob);
  });

  describe('Core Functionality', () => {
    describe('start', () => {
      it('should initialize and start the crawler successfully', async () => {
        await crawlerService.start();
        
        expect(prisma.crawlerJob.update).toHaveBeenCalledWith({
          where: { id: mockJob.id },
          data: expect.objectContaining({ status: 'running' })
        });
        
        expect(prisma.crawlerJob.update).toHaveBeenLastCalledWith({
          where: { id: mockJob.id },
          data: expect.objectContaining({ status: 'completed' })
        });
      });

      it('should not start if already running', async () => {
        (crawlerService as any).isRunning = true;
        await expect(crawlerService.start()).rejects.toThrow('Crawler is already running');
      });

      it('should handle initialization errors', async () => {
        const error = new Error('Initialization failed');
        jest.spyOn(crawlerService as any, 'initialize').mockRejectedValue(error);

        await crawlerService.start();

        expect(prisma.crawlerJob.update).toHaveBeenLastCalledWith({
          where: { id: mockJob.id },
          data: expect.objectContaining({ status: 'failed' })
        });
      });
    });

    describe('stop', () => {
      it('should stop the crawler gracefully', async () => {
        (crawlerService as any).isRunning = true;
        await crawlerService.stop();

        expect(prisma.crawlerJob.update).toHaveBeenCalledWith({
          where: { id: mockJob.id },
          data: expect.objectContaining({ status: 'cancelled' })
        });
        expect((crawlerService as any).isRunning).toBe(false);
      });

      it('should do nothing if crawler is not running', async () => {
        await crawlerService.stop();
        expect(prisma.crawlerJob.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('Crawling Process', () => {
    it('should process pages and items correctly', async () => {
      const mockItems = [
        { name: 'Product 1', price: '$10.00' },
        { name: 'Product 2', price: '$20.00' },
      ];

      (ConcurrentCrawler.prototype.processUrls as jest.Mock).mockResolvedValue(mockItems);
      (ProductMatcher.prototype.findMatch as jest.Mock).mockResolvedValue(null);

      await crawlerService.start();

      expect(prisma.product.create).toHaveBeenCalledTimes(2);
      expect(prisma.crawlerJob.update).toHaveBeenCalledWith({
        where: { id: mockJob.id },
        data: expect.objectContaining({
          itemsFound: 2,
          progress: expect.any(Number),
          successRate: 100,
        }),
      });
    });

    it('should handle pagination correctly', async () => {
      const mockNextPageButton = { click: jest.fn() };
      const page = (crawlerService as any).page;

      // Mock first page has next button, second page doesn't
      page.$.mockResolvedValueOnce(mockNextPageButton)
        .mockResolvedValueOnce(null);

      await crawlerService.start();

      expect(page.$).toHaveBeenCalledWith(mockConfig.selectors.listPage.nextPage);
      expect(mockNextPageButton.click).toHaveBeenCalled();
    });

    it('should respect maxPages configuration', async () => {
      mockConfig.options.maxPages = 2;
      const mockNextPageButton = { click: jest.fn() };
      const page = (crawlerService as any).page;

      // Mock always having a next button
      page.$.mockResolvedValue(mockNextPageButton);

      await crawlerService.start();

      // Should only process 2 pages
      expect(page.$).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during crawling', async () => {
      const error = new Error('Network error');
      (crawlerService as any).page.goto.mockRejectedValue(error);

      await crawlerService.start();

      expect(prisma.crawlerJobLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          level: 'ERROR',
          message: expect.stringContaining('Crawl failed'),
        }),
      });
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Authentication failed');
      (AuthManager.prototype.authenticate as jest.Mock).mockRejectedValue(error);

      await crawlerService.start();

      expect(prisma.crawlerJob.update).toHaveBeenLastCalledWith({
        where: { id: mockJob.id },
        data: expect.objectContaining({ status: 'failed' }),
      });
    });

    it('should handle item processing errors', async () => {
      const mockItems = [{ name: 'Invalid Product', price: 'invalid' }];
      (ConcurrentCrawler.prototype.processUrls as jest.Mock).mockResolvedValue(mockItems);
      (ProductMatcher.prototype.findMatch as jest.Mock).mockRejectedValue(new Error('Processing error'));

      await crawlerService.start();

      expect(prisma.crawlerJobLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          level: 'ERROR',
          message: expect.stringContaining('Failed to process item'),
        }),
      });
    });
  });

  describe('Utility Integration', () => {
    it('should use rate limiter correctly', async () => {
      await crawlerService.start();
      expect(RateLimiter).toHaveBeenCalledWith(mockConfig.rateLimit);
    });

    it('should use image processor for items with images', async () => {
      const mockItems = [{
        name: 'Product with Image',
        price: '$10.00',
        imageUrl: 'https://test.com/image.jpg',
      }];

      (ConcurrentCrawler.prototype.processUrls as jest.Mock).mockResolvedValue(mockItems);
      (CacheManager.prototype.get as jest.Mock).mockResolvedValue(null);
      (ImageProcessor.prototype.downloadAndProcess as jest.Mock).mockResolvedValue(Buffer.from('fake-image'));
      (ImageProcessor.prototype.uploadToStorage as jest.Mock).mockResolvedValue('https://storage.com/image.jpg');

      await crawlerService.start();

      expect(ImageProcessor.prototype.downloadAndProcess).toHaveBeenCalled();
      expect(ImageProcessor.prototype.uploadToStorage).toHaveBeenCalled();
    });

    it('should use product matcher for deduplication', async () => {
      const mockItems = [{ name: 'Existing Product', price: '$10.00' }];
      const existingProduct = { id: 'existing-id', name: 'Existing Product' };

      (ConcurrentCrawler.prototype.processUrls as jest.Mock).mockResolvedValue(mockItems);
      (ProductMatcher.prototype.findMatch as jest.Mock).mockResolvedValue(existingProduct);

      await crawlerService.start();

      expect(prisma.product.update).toHaveBeenCalled();
      expect(prisma.product.create).not.toHaveBeenCalled();
    });
  });

  describe('Progress Tracking', () => {
    it('should update progress correctly', async () => {
      await (crawlerService as any).updateJobProgress(5, 10);

      expect(prisma.crawlerJob.update).toHaveBeenCalledWith({
        where: { id: mockJob.id },
        data: expect.objectContaining({
          pagesProcessed: 5,
          itemsFound: 10,
          progress: 50,
          successRate: expect.any(Number),
        }),
      });
    });

    it('should calculate success rate correctly', async () => {
      mockJob.errors = [new Error('Test error')];
      await (crawlerService as any).updateJobProgress(5, 10);

      expect(prisma.crawlerJob.update).toHaveBeenCalledWith({
        where: { id: mockJob.id },
        data: expect.objectContaining({
          successRate: 90, // (10 - 1) / 10 * 100
        }),
      });
    });
  });
}); 