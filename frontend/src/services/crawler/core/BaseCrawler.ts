import puppeteer, { Browser, Page } from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import { AuthType, CrawlJobStatus } from '../types';
import { AuthManager } from '../utils/AuthManager';
import { RateLimiter } from '../utils/RateLimiter';
import { ImageProcessor } from '../utils/ImageProcessor';
import { ProductMatcher } from '../utils/ProductMatcher';

const prisma = new PrismaClient();

interface CrawlerConfiguration {
  id: string;
  authType: AuthType;
  startUrl: string;
  selectors: {
    product: string;
    name: string;
    price: string;
    description: string;
    image: string;
  };
}

interface Supplier {
  id: string;
  name: string;
  credentials?: {
    username?: string;
    password?: string;
    apiKey?: string;
  };
}

export class BaseCrawler {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private rateLimiter: RateLimiter;
  private authManager: AuthManager;
  private imageProcessor: ImageProcessor;
  private productMatcher: ProductMatcher;

  constructor(
    private configuration: CrawlerConfiguration,
    private supplier: Supplier,
    private jobId: string
  ) {
    this.rateLimiter = new RateLimiter();
    this.authManager = new AuthManager();
    this.imageProcessor = new ImageProcessor();
    this.productMatcher = new ProductMatcher();
  }

  async start() {
    try {
      await this.initialize();
      await this.authenticate();
      await this.crawl();
    } catch (error) {
      await this.logError('Crawler failed', error);
      await this.updateJobStatus(CrawlJobStatus.FAILED);
    } finally {
      await this.cleanup();
    }
  }

  private async initialize() {
    await this.logInfo('Initializing crawler');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  }

  private async authenticate() {
    if (!this.page) throw new Error('Page not initialized');

    await this.logInfo('Authenticating with supplier');
    
    try {
      await this.authManager.authenticate(
        this.page,
        this.configuration.authType,
        this.supplier.credentials
      );
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  private async crawl() {
    if (!this.page) throw new Error('Page not initialized');

    await this.logInfo('Starting crawl');
    await this.updateJobStatus(CrawlJobStatus.RUNNING);

    try {
      await this.page.goto(this.configuration.startUrl, {
        waitUntil: 'networkidle0',
      });

      let productsProcessed = 0;
      let errors = 0;

      while (true) {
        await this.rateLimiter.wait();

        const products = await this.page.$$(this.configuration.selectors.product);
        
        for (const product of products) {
          try {
            const productData = await this.extractProductData(product);
            await this.processProduct(productData);
            productsProcessed++;
          } catch (error) {
            errors++;
            await this.logError('Failed to process product', error);
          }

          await this.updateJobProgress(productsProcessed, errors);
        }

        const hasNextPage = await this.goToNextPage();
        if (!hasNextPage) break;
      }

      await this.updateJobStatus(CrawlJobStatus.COMPLETED);
      await this.logInfo('Crawl completed successfully');
    } catch (error) {
      throw new Error(`Crawl failed: ${error.message}`);
    }
  }

  private async extractProductData(productElement: puppeteer.ElementHandle) {
    const { selectors } = this.configuration;

    const name = await this.getElementText(productElement, selectors.name);
    const price = await this.getElementText(productElement, selectors.price);
    const description = await this.getElementText(productElement, selectors.description);
    const imageUrl = await this.getElementAttribute(productElement, selectors.image, 'src');

    return {
      name,
      price: this.parsePrice(price),
      description,
      imageUrl,
    };
  }

  private async processProduct(productData: any) {
    const imageBuffer = await this.imageProcessor.downloadAndProcess(productData.imageUrl);
    const existingProduct = await this.productMatcher.findMatch(productData);

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          price: productData.price,
          lastUpdated: new Date(),
        },
      });
    } else {
      await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          imageUrl: await this.imageProcessor.uploadToStorage(imageBuffer),
          supplierId: this.supplier.id,
        },
      });
    }
  }

  private async getElementText(parent: puppeteer.ElementHandle, selector: string): Promise<string> {
    try {
      const element = await parent.$(selector);
      return element ? (await element.evaluate(el => el.textContent))?.trim() || '' : '';
    } catch {
      return '';
    }
  }

  private async getElementAttribute(
    parent: puppeteer.ElementHandle,
    selector: string,
    attribute: string
  ): Promise<string> {
    try {
      const element = await parent.$(selector);
      return element ? (await element.evaluate((el, attr) => el.getAttribute(attr), attribute)) || '' : '';
    } catch {
      return '';
    }
  }

  private parsePrice(priceString: string): number {
    const cleaned = priceString.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  private async goToNextPage(): Promise<boolean> {
    // Implement pagination logic based on the supplier's website structure
    return false;
  }

  private async updateJobStatus(status: CrawlJobStatus) {
    await prisma.crawlerJob.update({
      where: { id: this.jobId },
      data: { status },
    });
  }

  private async updateJobProgress(productsProcessed: number, errors: number) {
    await prisma.crawlerJob.update({
      where: { id: this.jobId },
      data: {
        productsProcessed,
        errors,
        successRate: productsProcessed > 0 ? 
          ((productsProcessed - errors) / productsProcessed) * 100 : 0,
      },
    });
  }

  private async logInfo(message: string) {
    await prisma.crawlerJobLog.create({
      data: {
        jobId: this.jobId,
        level: 'INFO',
        message,
      },
    });
  }

  private async logError(message: string, error: any) {
    await prisma.crawlerJobLog.create({
      data: {
        jobId: this.jobId,
        level: 'ERROR',
        message,
        details: { error: error.message, stack: error.stack },
      },
    });
  }

  private async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
} 