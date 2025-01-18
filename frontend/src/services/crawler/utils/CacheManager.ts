import { createHash } from 'crypto';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export class CacheManager {
  private cacheDir: string;
  private cacheDuration: number;

  constructor(cacheDir: string = '.cache/crawler', cacheDuration: number = 24 * 60 * 60 * 1000) {
    this.cacheDir = cacheDir;
    this.cacheDuration = cacheDuration;
  }

  async initialize(): Promise<void> {
    try {
      await mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  private getCacheKey(url: string, params?: Record<string, any>): string {
    const data = params ? `${url}-${JSON.stringify(params)}` : url;
    return createHash('md5').update(data).digest('hex');
  }

  private getCachePath(key: string): string {
    return join(this.cacheDir, `${key}.json`);
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T | null> {
    const key = this.getCacheKey(url, params);
    const path = this.getCachePath(key);

    try {
      const data = await readFile(path, 'utf-8');
      const { value, timestamp } = JSON.parse(data);

      if (Date.now() - timestamp > this.cacheDuration) {
        return null;
      }

      return value as T;
    } catch {
      return null;
    }
  }

  async set<T>(url: string, value: T, params?: Record<string, any>): Promise<void> {
    const key = this.getCacheKey(url, params);
    const path = this.getCachePath(key);
    const data = {
      value,
      timestamp: Date.now(),
    };

    try {
      await writeFile(path, JSON.stringify(data), 'utf-8');
    } catch (error) {
      console.error('Failed to write to cache:', error);
    }
  }

  async invalidate(url: string, params?: Record<string, any>): Promise<void> {
    const key = this.getCacheKey(url, params);
    const path = this.getCachePath(key);

    try {
      await unlink(path);
    } catch {
      // Ignore if file doesn't exist
    }
  }
} 