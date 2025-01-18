import { NextRequest, NextResponse } from 'next/server';
import redis from './redis';

// Cache configuration
const DEFAULT_TTL = 300; // 5 minutes
const CACHE_ENABLED = process.env.ENABLE_CACHE === 'true';

interface CacheConfig {
  ttl?: number;
  keyPrefix?: string;
  condition?: (req: NextRequest) => boolean;
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: NextRequest, keyPrefix?: string): string {
  const url = new URL(req.url);
  const key = `${keyPrefix || ''}:${req.method}:${url.pathname}${url.search}`;
  return key.toLowerCase();
}

/**
 * Check if request should be cached
 */
function shouldCache(req: NextRequest): boolean {
  // Only cache GET requests
  if (req.method !== 'GET') return false;

  // Don't cache authenticated requests
  const authHeader = req.headers.get('authorization');
  if (authHeader) return false;

  return true;
}

/**
 * Cache middleware factory
 */
export function withCache(config: CacheConfig = {}) {
  return async function cache(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    if (!CACHE_ENABLED) {
      return handler();
    }

    const shouldCacheRequest = config.condition 
      ? config.condition(req) 
      : shouldCache(req);

    if (!shouldCacheRequest) {
      return handler();
    }

    const cacheKey = generateCacheKey(req, config.keyPrefix);
    
    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return new NextResponse(JSON.stringify(data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          }
        });
      }

      // Get fresh data
      const response = await handler();
      const data = await response.json();

      // Cache the response
      await redis.setex(
        cacheKey,
        config.ttl || DEFAULT_TTL,
        JSON.stringify(data)
      );

      return new NextResponse(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS'
        }
      });
    } catch (error) {
      console.error('Cache error:', error);
      // On cache error, bypass cache
      return handler();
    }
  };
}

/**
 * Invalidate cache entries by pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

/**
 * Clear entire cache
 */
export async function clearCache(): Promise<void> {
  await redis.flushall();
}

/**
 * Get cache stats
 */
export async function getCacheStats() {
  const info = await redis.info();
  const stats = {
    keys: await redis.dbsize(),
    memory: info.split('\n').find(line => line.startsWith('used_memory_human'))?.split(':')[1].trim(),
    hits: info.split('\n').find(line => line.startsWith('keyspace_hits'))?.split(':')[1].trim(),
    misses: info.split('\n').find(line => line.startsWith('keyspace_misses'))?.split(':')[1].trim()
  };
  return stats;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
}); 