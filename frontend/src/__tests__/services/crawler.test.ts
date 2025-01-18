import { CrawlerService } from '@/services/crawler';
import { CrawlerConfig, CrawlerJob, AuthType } from '@/types/crawler';
import { RateLimiter } from '@/services/crawler/utils/RateLimiter';
import { AuthManager } from '@/services/crawler/utils/AuthManager';
import { ImageProcessor } from '@/services/crawler/utils/ImageProcessor';
import { ProductMatcher } from '@/services/crawler/utils/ProductMatcher';

// Mock dependencies
jest.mock('@/services/crawler/utils/RateLimiter');
jest.mock('@/services/crawler/utils/AuthManager');
jest.mock('@/services/crawler/utils/ImageProcessor');
jest.mock('@/services/crawler/utils/ProductMatcher');
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setViewport: jest.fn(),
      setUserAgent: jest.fn(),
      goto: jest.fn(),
      $$eval: jest.fn(),
      $: jest.fn(),
      waitForNavigation: jest.fn(),
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
}));
jest.mock('@/lib/prisma', () => ({
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
}));

describe('CrawlerService', () => {
  let crawlerService: CrawlerService;
  let mockConfig: CrawlerConfig;
  let mockJob: CrawlerJob;

  beforeEach(() => {
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

    mockJob = {
      id: 'test-job',
      configId: 'test-config',
      startTime: new Date(),
      status: 'idle',
      pagesProcessed: 0,
      itemsFound: 0,
      errors: [],
      progress: 0,
      successRate: 100,
      config: mockConfig,
    };

    crawlerService = new CrawlerService(mockConfig, mockJob);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('should initialize and start the crawler', async () => {
      await crawlerService.start();
      expect(mockJob.status).toBe('completed');
    });

    it('should handle errors during crawling', async () => {
      const error = new Error('Test error');
      jest.spyOn(crawlerService as any, 'initialize').mockRejectedValue(error);
      
      await crawlerService.start();
      expect(mockJob.status).toBe('failed');
    });

    it('should not start if already running', async () => {
      (crawlerService as any).isRunning = true;
      await expect(crawlerService.start()).rejects.toThrow('Crawler is already running');
    });
  });

  describe('stop', () => {
    it('should stop the crawler gracefully', async () => {
      (crawlerService as any).isRunning = true;
      await crawlerService.stop();
      expect(mockJob.status).toBe('cancelled');
      expect((crawlerService as any).isRunning).toBe(false);
    });

    it('should do nothing if crawler is not running', async () => {
      await crawlerService.stop();
      expect(mockJob.status).toBe('idle');
    });
  });

  describe('extractItems', () => {
    it('should extract items from the page', async () => {
      const mockItems = [
        { name: 'Test Product', price: '$10.00' },
      ];
      
      (crawlerService as any).page = {
        $$eval: jest.fn().mockResolvedValue(mockItems),
      };

      const items = await (crawlerService as any).extractItems();
      expect(items).toEqual(mockItems);
    });
  });

  describe('processItems', () => {
    it('should process and save items', async () => {
      const mockItems = [
        {
          name: 'Test Product',
          price: '$10.00',
          imageUrl: 'https://test.com/image.jpg',
        },
      ];

      await (crawlerService as any).processItems(mockItems);
      expect(mockJob.itemsFound).toBe(1);
    });

    it('should handle errors during item processing', async () => {
      const mockItems = [
        { name: 'Test Product', price: 'invalid' },
      ];

      await (crawlerService as any).processItems(mockItems);
      expect(mockJob.errors.length).toBe(1);
    });
  });

  describe('updateJobProgress', () => {
    it('should update job progress correctly', async () => {
      await (crawlerService as any).updateJobProgress(5, 10);
      expect(mockJob.progress).toBe(50);
      expect(mockJob.successRate).toBe(100);
    });
  });
}); 