import { chromium, ProxySettings } from 'playwright';
import {
  CrawlTarget,
  CrawlResult,
  CrawlFrequency,
  crawlTargetSchema,
  crawlResultSchema
} from '@/types/crawler';
import { RateLimiter } from '@/lib/rateLimiter';
import { ErrorRecoverySystem } from '@/lib/errorRecovery';
import { prisma } from '@/lib/prisma';
import { EventEmitter } from 'events';

interface CrawlerMetrics {
  totalCrawls: number;
  successfulCrawls: number;
  failedCrawls: number;
  averageDuration: number;
  lastError?: string;
  lastSuccess?: Date;
}

export class CrawlerService extends EventEmitter {
  private static instance: CrawlerService;
  private rateLimiter: RateLimiter;
  private errorRecovery: ErrorRecoverySystem;
  private metrics: Map<string, CrawlerMetrics>;
  private proxyList: ProxySettings[];
  private currentProxyIndex: number;
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

  private constructor() {
    super();
    this.rateLimiter = new RateLimiter({
      tokensPerInterval: 60,
      interval: 'minute'
    });
    this.errorRecovery = ErrorRecoverySystem.getInstance();
    this.metrics = new Map();
    this.proxyList = [];
    this.currentProxyIndex = 0;

    // Setup event listeners for monitoring
    this.on('crawl:start', this.onCrawlStart.bind(this));
    this.on('crawl:success', this.onCrawlSuccess.bind(this));
    this.on('crawl:error', this.onCrawlError.bind(this));

    // Setup error recovery listeners
    this.errorRecovery.on('alert:threshold_exceeded', this.handleErrorThresholdExceeded.bind(this));
  }

  public static getInstance(): CrawlerService {
    if (!CrawlerService.instance) {
      CrawlerService.instance = new CrawlerService();
    }
    return CrawlerService.instance;
  }

  // Proxy management
  public setProxies(proxies: ProxySettings[]): void {
    this.proxyList = proxies;
    this.currentProxyIndex = 0;
  }

  private getNextProxy(): ProxySettings | undefined {
    if (this.proxyList.length === 0) return undefined;
    const proxy = this.proxyList[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
    return proxy;
  }

  // Metrics management
  private initializeMetrics(targetId: string): void {
    if (!this.metrics.has(targetId)) {
      this.metrics.set(targetId, {
        totalCrawls: 0,
        successfulCrawls: 0,
        failedCrawls: 0,
        averageDuration: 0
      });
    }
  }

  private onCrawlStart(targetId: string): void {
    this.initializeMetrics(targetId);
    const metrics = this.metrics.get(targetId)!;
    metrics.totalCrawls++;
  }

  private onCrawlSuccess(targetId: string, duration: number): void {
    const metrics = this.metrics.get(targetId)!;
    metrics.successfulCrawls++;
    metrics.lastSuccess = new Date();
    metrics.averageDuration = (
      (metrics.averageDuration * (metrics.successfulCrawls - 1) + duration) /
      metrics.successfulCrawls
    );
  }

  private onCrawlError(targetId: string, error: string): void {
    const metrics = this.metrics.get(targetId)!;
    metrics.failedCrawls++;
    metrics.lastError = error;
  }

  public getMetrics(targetId: string): CrawlerMetrics | undefined {
    return this.metrics.get(targetId);
  }

  // Error recovery and retry logic
  private async handleErrorThresholdExceeded(data: { targetId: string; unresolved: number; threshold: number }): Promise<void> {
    // Pause the target when error threshold is exceeded
    await prisma.crawlTarget.update({
      where: { id: data.targetId },
      data: { status: 'PAUSED' }
    });

    // Emit event for monitoring
    this.emit('target:paused', {
      targetId: data.targetId,
      reason: `Error threshold exceeded: ${data.unresolved} unresolved errors`
    });
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    targetId: string,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Record the error
      await this.errorRecovery.recordError(targetId, error as Error);

      // Check if we should retry
      if (await this.errorRecovery.shouldRetry(targetId)) {
        const delay = this.errorRecovery.getRetryDelay(retryCount);
        console.warn(
          `[CrawlerService] Retry ${retryCount + 1} for target ${targetId} after ${delay}ms`
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));

        // Try with a different proxy if available
        if (this.proxyList.length > 0) {
          console.log('[CrawlerService] Switching proxy for retry');
        }

        return this.executeWithRetry(operation, targetId, retryCount + 1);
      }

      throw error;
    }
  }

  async createTarget(data: Omit<CrawlTarget, 'id' | 'createdAt' | 'updatedAt' | 'lastCrawled'>): Promise<CrawlTarget> {
    try {
      // Validate target data
      const validatedData = crawlTargetSchema.parse(data);

      // Create target in database
      const target = await prisma.crawlTarget.create({
        data: {
          ...validatedData,
          isActive: true
        }
      });

      // Create schedule if frequency is not custom
      if (validatedData.frequency !== CrawlFrequency.CUSTOM) {
        await this.createSchedule(target.id, validatedData.frequency);
      }

      return target;
    } catch (error) {
      console.error('[CrawlerService] createTarget error:', error);
      throw error;
    }
  }

  async updateTarget(id: string, data: Partial<CrawlTarget>): Promise<CrawlTarget> {
    try {
      const target = await prisma.crawlTarget.update({
        where: { id },
        data
      });

      // Update schedule if frequency changed
      if (data.frequency) {
        await this.updateSchedule(id, data.frequency);
      }

      return target;
    } catch (error) {
      console.error('[CrawlerService] updateTarget error:', error);
      throw error;
    }
  }

  async deleteTarget(id: string): Promise<void> {
    try {
      await prisma.crawlTarget.delete({
        where: { id }
      });
    } catch (error) {
      console.error('[CrawlerService] deleteTarget error:', error);
      throw error;
    }
  }

  async executeCrawl(targetId: string): Promise<CrawlResult> {
    this.emit('crawl:start', targetId);
    const startTime = Date.now();

    try {
      // Get target
      const target = await prisma.crawlTarget.findUnique({
        where: { id: targetId }
      });

      if (!target) {
        throw new Error('Target not found');
      }

      // Check if target is active
      if (target.status !== 'ACTIVE') {
        throw new Error(`Target is ${target.status.toLowerCase()}`);
      }

      // Check rate limit
      await this.rateLimiter.removeTokens(1);

      let result: CrawlResult;

      try {
        // Launch browser with retry logic
        result = await this.executeWithRetry(async () => {
          const browser = await chromium.launch();
          const context = await browser.newContext({
            userAgent: 'Bulk Buyer Group Crawler/1.0',
            ...this.getNextProxy(),
            ...target.metadata.headers && {
              extraHTTPHeaders: target.metadata.headers
            }
          });

          // Enhanced error handling and monitoring
          context.setDefaultTimeout(30000); // 30 seconds
          context.on('console', msg => {
            console.log(`[Browser Console] ${msg.text()}`);
          });

          // Create new page with error monitoring
          const page = await context.newPage();
          page.on('pageerror', error => {
            console.error(`[Page Error] ${error.message}`);
          });
          page.on('requestfailed', request => {
            console.error(`[Request Failed] ${request.url()}: ${request.failure()?.errorText}`);
          });

          // Set cookies if provided
          if (target.metadata.cookies) {
            await context.addCookies(
              Object.entries(target.metadata.cookies).map(([name, value]) => ({
                name,
                value,
                url: target.url
              }))
            );
          }

          // Navigate to URL with enhanced error handling
          const response = await page.goto(target.url, {
            waitUntil: 'networkidle',
            timeout: 30000
          });

          if (!response?.ok()) {
            throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
          }

          // Extract data based on selectors with enhanced error handling
          const data: Record<string, any> = {};
          
          // Get main content
          const content = await page.$(target.selector);
          if (content) {
            data.content = await content.innerHTML();
          } else {
            console.warn(`[CrawlerService] Main selector not found: ${target.selector}`);
          }

          // Get additional data with enhanced error handling
          const selectors = {
            price: target.metadata.priceSelector,
            stock: target.metadata.stockSelector,
            title: target.metadata.titleSelector,
            image: target.metadata.imageSelector,
            ...target.metadata.customSelectors
          };

          for (const [key, selector] of Object.entries(selectors)) {
            if (selector) {
              try {
                if (key === 'image') {
                  data[key] = await page.$eval(
                    selector,
                    el => (el as HTMLImageElement).src
                  );
                } else {
                  data[key] = await page.$eval(
                    selector,
                    el => el.textContent?.trim()
                  );
                }
              } catch (error) {
                console.warn(`[CrawlerService] Failed to extract ${key}: ${error}`);
                data[key] = null;
              }
            }
          }

          // Close browser
          await browser.close();

          return {
            id: crypto.randomUUID(),
            targetId,
            timestamp: new Date(),
            success: true,
            data,
            duration: Date.now() - startTime,
            statusCode: response.status()
          };
        }, targetId);

      } catch (error) {
        result = {
          id: crypto.randomUUID(),
          targetId,
          timestamp: new Date(),
          success: false,
          data: {},
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime,
          statusCode: 500
        };

        this.emit('crawl:error', targetId, result.error);
        throw error;
      }

      // Validate and save result
      const validatedResult = crawlResultSchema.parse(result);
      await prisma.crawlResult.create({
        data: validatedResult
      });

      // Update target last crawled time
      await prisma.crawlTarget.update({
        where: { id: targetId },
        data: { lastCrawled: new Date() }
      });

      // If successful, clear any existing errors
      await this.errorRecovery.clearErrors(targetId);

      this.emit('crawl:success', targetId, result.duration);
      return validatedResult;
    } catch (error) {
      console.error('[CrawlerService] executeCrawl error:', error);
      throw error;
    }
  }

  private async createSchedule(targetId: string, frequency: CrawlFrequency): Promise<void> {
    const nextRun = this.calculateNextRun(frequency);

    await prisma.crawlSchedule.create({
      data: {
        targetId,
        frequency,
        nextRun,
        isActive: true
      }
    });
  }

  private async updateSchedule(targetId: string, frequency: CrawlFrequency): Promise<void> {
    const nextRun = this.calculateNextRun(frequency);

    await prisma.crawlSchedule.update({
      where: { targetId },
      data: {
        frequency,
        nextRun
      }
    });
  }

  private calculateNextRun(frequency: CrawlFrequency): Date {
    const now = new Date();
    
    switch (frequency) {
      case CrawlFrequency.HOURLY:
        return new Date(now.setHours(now.getHours() + 1));
      case CrawlFrequency.DAILY:
        return new Date(now.setDate(now.getDate() + 1));
      case CrawlFrequency.WEEKLY:
        return new Date(now.setDate(now.getDate() + 7));
      case CrawlFrequency.MONTHLY:
        return new Date(now.setMonth(now.getMonth() + 1));
      default:
        return now;
    }
  }
} 