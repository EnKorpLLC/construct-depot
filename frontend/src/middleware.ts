import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getToken } from 'next-auth/jwt';

// Create Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Create rate limiters
const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '5 m'), // 5 requests per 5 minutes
  analytics: true,
  prefix: '@upstash/ratelimit/auth',
});

const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '5 m'), // 3 attempts per 5 minutes
  analytics: true,
  prefix: '@upstash/ratelimit/login',
});

const mfaLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '5 m'), // 3 attempts per 5 minutes
  analytics: true,
  prefix: '@upstash/ratelimit/mfa',
});

const analyticsLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
  prefix: '@upstash/ratelimit/analytics',
});

export async function middleware(request: NextRequest) {
  const ip = request.ip || 'anonymous';
  const path = request.nextUrl.pathname;

  // Handle analytics endpoints
  if (path.startsWith('/api/analytics/')) {
    // Verify session token
    const token = await getToken({ req: request });
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Apply rate limiting
    const result = await analyticsLimiter.limit(`${ip}:${token.sub}`);
    const remaining = result.remaining;

    // Set rate limit headers
    const res = NextResponse.next();
    res.headers.set('X-RateLimit-Limit', result.limit.toString());
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
    res.headers.set('X-RateLimit-Reset', result.reset.toString());

    // Block if no remaining requests
    if (!remaining) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString()
          }
        }
      );
    }

    return res;
  }

  // Rate limit based on path
  let result;
  if (path.startsWith('/api/auth/login')) {
    result = await loginLimiter.limit(ip);
  } else if (path.startsWith('/api/auth/mfa')) {
    result = await mfaLimiter.limit(ip);
  } else if (path.startsWith('/api/auth/')) {
    result = await authLimiter.limit(ip);
  } else {
    return NextResponse.next();
  }

  const remaining = result.remaining;

  // Set rate limit headers
  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Limit', result.limit.toString());
  res.headers.set('X-RateLimit-Remaining', remaining.toString());
  res.headers.set('X-RateLimit-Reset', result.reset.toString());

  // Block if no remaining requests
  if (!remaining) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString()
        }
      }
    );
  }

  return res;
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/analytics/:path*'
  ]
}; 