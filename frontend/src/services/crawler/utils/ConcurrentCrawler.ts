import { Browser, Page } from 'puppeteer';
import { CrawlerConfig } from '@/types/crawler';
import { RateLimiter } from './RateLimiter';
import { CacheManager } from './CacheManager';

interface CrawlerWorker {
  id: number;
  page: Page;
  busy: boolean;
}

export class ConcurrentCrawler {
  private browser: Browser;
  private workers: CrawlerWorker[] = [];
  private config: CrawlerConfig;
  private rateLimiter: RateLimiter;
  private cacheManager: CacheManager;
  private maxWorkers: number;

  constructor(
    browser: Browser,
    config: CrawlerConfig,
    maxWorkers: number = 3
  ) {
    this.browser = browser;
    this.config = config;
    this.maxWorkers = maxWorkers;
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.cacheManager = new CacheManager();
  }

  async initialize(): Promise<void> {
    await this.cacheManager.initialize();
    await this.createWorkers();
  }

  private async createWorkers(): Promise<void> {
    for (let i = 0; i < this.maxWorkers; i++) {
      const page = await this.browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      this.workers.push({
        id: i,
        page,
        busy: false,
      });
    }
  }

  async processUrls(urls: string[]): Promise<any[]> {
    const results: any[] = [];
    const chunks = this.chunkArray(urls, this.maxWorkers);

    for (const chunk of chunks) {
      const promises = chunk.map(url => this.processUrl(url));
      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults.flat());
    }

    return results;
  }

  private async processUrl(url: string): Promise<any> {
    const cachedData = await this.cacheManager.get(url);
    if (cachedData) {
      return cachedData;
    }

    const worker = await this.getAvailableWorker();
    if (!worker) {
      throw new Error('No available workers');
    }

    try {
      worker.busy = true;
      await this.rateLimiter.wait();
      
      await worker.page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: this.config.options.timeout,
      });

      const data = await this.extractData(worker.page);
      await this.cacheManager.set(url, data);

      return data;
    } finally {
      worker.busy = false;
    }
  }

  private async extractData(page: Page): Promise<any> {
    const { selectors } = this.config;
    return page.$$eval(
      selectors.listPage.productContainer,
      (elements, selectors) => elements.map(element => ({
        name: element.querySelector(selectors.productPage.name)?.textContent?.trim(),
        sku: element.querySelector(selectors.productPage.sku)?.textContent?.trim(),
        price: element.querySelector(selectors.productPage.price)?.textContent?.trim(),
        description: element.querySelector(selectors.productPage.description)?.textContent?.trim(),
        category: element.querySelector(selectors.productPage.category)?.textContent?.trim(),
        imageUrl: element.querySelector(selectors.productPage.images)?.getAttribute('src'),
      })),
      selectors
    );
  }

  private async getAvailableWorker(): Promise<CrawlerWorker | null> {
    const worker = this.workers.find(w => !w.busy);
    if (worker) {
      return worker;
    }

    // Wait for a worker to become available
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.getAvailableWorker();
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async cleanup(): Promise<void> {
    await Promise.all(
      this.workers.map(async worker => {
        await worker.page.close();
      })
    );
    this.workers = [];
  }
} 