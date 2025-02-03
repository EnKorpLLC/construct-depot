import { PrismaClient, Product, CrawlerSchedule, PriceHistory } from '@prisma/client';
import puppeteer from 'puppeteer';
import { z } from 'zod';
import { Redis } from 'ioredis';

const productSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  inventory: z.number().int().positive(),
  minOrderQuantity: z.number().int().positive(),
});

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  // Add more user agents as needed
];

export class ProductCrawlerService {
  private prisma: PrismaClient;
  private redis: Redis;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  private async isRateLimited(domain: string): Promise<boolean> {
    const key = `crawler_rate_limit:${domain}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 60); // 1 minute window
    }
    return count > 60; // 60 requests per minute per domain
  }

  async validateUrl(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Check domain whitelist
      const allowedDomain = await this.prisma.crawlerDomain.findUnique({
        where: { domain },
      });

      if (!allowedDomain?.isAllowed) {
        return false;
      }

      // Check rate limiting
      if (await this.isRateLimited(domain)) {
        throw new Error('Rate limit exceeded for domain');
      }

      return true;
    } catch {
      return false;
    }
  }

  async crawlProducts(url: string, selectors: Record<string, string>, supplierId: string): Promise<Product[]> {
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent(this.getRandomUserAgent());
      
      const response = await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      if (!response?.ok()) {
        throw new Error(`Failed to load page: ${response?.status()}`);
      }

      // Extract products based on provided selectors
      const products = await page.evaluate((selectors) => {
        const productElements = document.querySelectorAll(selectors.productContainer);
        return Array.from(productElements).map((el) => ({
          name: el.querySelector(selectors.name)?.textContent?.trim() || '',
          description: el.querySelector(selectors.description)?.textContent?.trim(),
          price: parseFloat(el.querySelector(selectors.price)?.textContent?.replace(/[^0-9.]/g, '') || '0'),
          inventory: parseInt(el.querySelector(selectors.inventory)?.textContent?.replace(/[^0-9]/g, '') || '0'),
          minOrderQuantity: parseInt(el.querySelector(selectors.minOrderQuantity)?.textContent?.replace(/[^0-9]/g, '') || '1'),
        }));
      }, selectors);

      await browser.close();

      // Validate and store products with price history
      const validProducts: Product[] = [];
      for (const product of products) {
        try {
          const validatedProduct = productSchema.parse(product);
          
          // Check for existing product
          const existingProduct = await this.prisma.product.findFirst({
            where: {
              name: validatedProduct.name,
              supplierId,
            },
          });

          if (existingProduct) {
            // Update existing product and add price history
            if (existingProduct.price !== validatedProduct.price) {
              await this.prisma.priceHistory.create({
                data: {
                  productId: existingProduct.id,
                  price: validatedProduct.price,
                  source: 'crawler',
                },
              });
            }

            const updatedProduct = await this.prisma.product.update({
              where: { id: existingProduct.id },
              data: {
                ...validatedProduct,
                updatedAt: new Date(),
              },
            });
            validProducts.push(updatedProduct);
          } else {
            // Create new product with initial price history
            const newProduct = await this.prisma.product.create({
              data: {
                ...validatedProduct,
                supplierId,
                isSystemProduct: true,
                priceHistory: {
                  create: {
                    price: validatedProduct.price,
                    source: 'crawler',
                  },
                },
              },
            });
            validProducts.push(newProduct);
          }
        } catch (error) {
          console.error(`Failed to validate/save product: ${product.name}`, error);
        }
      }

      return validProducts;
    } catch (error) {
      console.error('Crawler error:', error);
      throw new Error('Failed to crawl products');
    }
  }

  async createSchedule(data: {
    url: string;
    frequency: string;
    supplierId: string;
  }): Promise<CrawlerSchedule> {
    const urlObj = new URL(data.url);
    const nextCrawl = this.calculateNextCrawl(data.frequency);

    return this.prisma.crawlerSchedule.create({
      data: {
        ...data,
        domain: urlObj.hostname,
        nextCrawl,
      },
    });
  }

  private calculateNextCrawl(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.setDate(now.getDate() + 1));
      case 'weekly':
        return new Date(now.setDate(now.getDate() + 7));
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1));
      default:
        return new Date(now.setDate(now.getDate() + 1));
    }
  }

  async processScheduledCrawls(): Promise<void> {
    const now = new Date();
    const schedules = await this.prisma.crawlerSchedule.findMany({
      where: {
        isActive: true,
        nextCrawl: {
          lte: now,
        },
      },
    });

    for (const schedule of schedules) {
      try {
        await this.crawlProducts(schedule.url, {}, schedule.supplierId);
        
        // Update schedule
        await this.prisma.crawlerSchedule.update({
          where: { id: schedule.id },
          data: {
            lastCrawled: now,
            nextCrawl: this.calculateNextCrawl(schedule.frequency),
          },
        });
      } catch (error) {
        console.error(`Failed to process scheduled crawl for ${schedule.url}:`, error);
      }
    }
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
    await this.redis.quit();
  }
} 