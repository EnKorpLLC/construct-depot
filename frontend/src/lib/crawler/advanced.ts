import { ProxySettings } from 'playwright';
import { prisma } from '../prisma';

interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

interface CookieConfig {
  name: string;
  value: string;
  domain: string;
  path?: string;
}

export class CrawlerAdvancedFeatures {
  private static instance: CrawlerAdvancedFeatures;
  private proxyPool: ProxyConfig[];
  private proxyIndex: number;
  private customHeaders: Map<string, Record<string, string>>;
  private cookieJar: Map<string, CookieConfig[]>;

  private constructor() {
    this.proxyPool = [];
    this.proxyIndex = 0;
    this.customHeaders = new Map();
    this.cookieJar = new Map();
  }

  public static getInstance(): CrawlerAdvancedFeatures {
    if (!CrawlerAdvancedFeatures.instance) {
      CrawlerAdvancedFeatures.instance = new CrawlerAdvancedFeatures();
    }
    return CrawlerAdvancedFeatures.instance;
  }

  // Proxy Management
  async addProxy(proxy: ProxyConfig): Promise<void> {
    this.proxyPool.push(proxy);
    
    // Store in database
    await prisma.proxyConfig.create({
      data: {
        host: proxy.host,
        port: proxy.port,
        username: proxy.username,
        password: proxy.password,
        isActive: true
      }
    });
  }

  async removeProxy(host: string, port: number): Promise<void> {
    this.proxyPool = this.proxyPool.filter(
      p => !(p.host === host && p.port === port)
    );
    
    await prisma.proxyConfig.updateMany({
      where: { host, port },
      data: { isActive: false }
    });
  }

  getNextProxy(): ProxySettings | undefined {
    if (this.proxyPool.length === 0) return undefined;

    const proxy = this.proxyPool[this.proxyIndex];
    this.proxyIndex = (this.proxyIndex + 1) % this.proxyPool.length;

    return {
      server: `http://${proxy.host}:${proxy.port}`,
      ...(proxy.username && proxy.password && {
        username: proxy.username,
        password: proxy.password
      })
    };
  }

  async rotateProxy(): Promise<ProxySettings | undefined> {
    // Get next proxy from pool
    const proxy = this.getNextProxy();
    
    // Log rotation
    if (proxy) {
      await prisma.proxyRotation.create({
        data: {
          proxyHost: proxy.server,
          timestamp: new Date()
        }
      });
    }

    return proxy;
  }

  // Custom Headers Management
  async setCustomHeaders(targetId: string, headers: Record<string, string>): Promise<void> {
    this.customHeaders.set(targetId, headers);
    
    await prisma.crawlTarget.update({
      where: { id: targetId },
      data: {
        metadata: {
          update: {
            headers
          }
        }
      }
    });
  }

  getCustomHeaders(targetId: string): Record<string, string> {
    return this.customHeaders.get(targetId) || {};
  }

  // Cookie Management
  async setCookies(targetId: string, cookies: CookieConfig[]): Promise<void> {
    this.cookieJar.set(targetId, cookies);
    
    await prisma.crawlTarget.update({
      where: { id: targetId },
      data: {
        metadata: {
          update: {
            cookies: cookies.reduce((acc, cookie) => ({
              ...acc,
              [cookie.name]: cookie.value
            }), {})
          }
        }
      }
    });
  }

  getCookies(targetId: string): CookieConfig[] {
    return this.cookieJar.get(targetId) || [];
  }

  // Browser Configuration
  async getBrowserConfig(targetId: string): Promise<{
    proxy?: ProxySettings;
    headers: Record<string, string>;
    cookies: CookieConfig[];
  }> {
    return {
      proxy: await this.rotateProxy(),
      headers: this.getCustomHeaders(targetId),
      cookies: this.getCookies(targetId)
    };
  }

  // Load configurations from database
  async loadConfigurations(): Promise<void> {
    // Load proxies
    const proxies = await prisma.proxyConfig.findMany({
      where: { isActive: true }
    });
    
    this.proxyPool = proxies.map(p => ({
      host: p.host,
      port: p.port,
      username: p.username || undefined,
      password: p.password || undefined
    }));

    // Load target configurations
    const targets = await prisma.crawlTarget.findMany({
      select: {
        id: true,
        metadata: true
      }
    });

    targets.forEach(target => {
      if (target.metadata.headers) {
        this.customHeaders.set(target.id, target.metadata.headers);
      }
      
      if (target.metadata.cookies) {
        const cookies = Object.entries(target.metadata.cookies).map(([name, value]) => ({
          name,
          value,
          domain: new URL(target.metadata.url).hostname
        }));
        this.cookieJar.set(target.id, cookies);
      }
    });
  }
} 