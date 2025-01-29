import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Redis } from 'ioredis';
import { z } from 'zod';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Security configuration
const SECURITY_CONFIG = {
  maxRequestsPerMinute: 60,
  maxConcurrentJobs: 5,
  maxJobDuration: 3600, // 1 hour
  requiredRoles: ['ADMIN', 'SUPPLIER'],
  ipWhitelist: process.env.IP_WHITELIST?.split(',') || [],
  userAgentPattern: /^BulkBuyerBot\/\d+\.\d+$/,
};

// Request validation schema
const requestSchema = z.object({
  targetUrl: z.string().url(),
  rateLimit: z.number().min(1).max(100),
  schedule: z.string().regex(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/),
  selectors: z.record(z.string()),
});

export class CrawlerSecurity {
  private static instance: CrawlerSecurity;
  private blockedIPs: Set<string> = new Set();
  private suspiciousActivities: Map<string, number> = new Map();

  private constructor() {
    // Initialize security monitoring
    this.startSecurityMonitoring();
  }

  public static getInstance(): CrawlerSecurity {
    if (!CrawlerSecurity.instance) {
      CrawlerSecurity.instance = new CrawlerSecurity();
    }
    return CrawlerSecurity.instance;
  }

  private async startSecurityMonitoring() {
    setInterval(() => {
      this.suspiciousActivities.clear();
    }, 3600000); // Clear suspicious activities every hour
  }

  private generateRequestSignature(req: NextRequest): string {
    const data = `${req.url}${req.headers.get('authorization')}${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async isRateLimited(identifier: string): Promise<boolean> {
    const key = `rate_limit:${identifier}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 60);
    }
    return count > SECURITY_CONFIG.maxRequestsPerMinute;
  }

  private async validateRequest(req: NextRequest): Promise<boolean> {
    try {
      const body = await req.json();
      await requestSchema.parseAsync(body);
      return true;
    } catch {
      return false;
    }
  }

  private isWhitelistedIP(ip: string): boolean {
    return SECURITY_CONFIG.ipWhitelist.includes(ip);
  }

  private isValidUserAgent(userAgent: string): boolean {
    return SECURITY_CONFIG.userAgentPattern.test(userAgent);
  }

  private async logSuspiciousActivity(ip: string, reason: string) {
    const count = (this.suspiciousActivities.get(ip) || 0) + 1;
    this.suspiciousActivities.set(ip, count);

    if (count >= 5) {
      this.blockedIPs.add(ip);
      await redis.setex(`blocked_ip:${ip}`, 86400, '1'); // Block for 24 hours
    }

    // Log the suspicious activity
    console.error(`Suspicious activity detected from ${ip}: ${reason}`);
  }

  public async middleware(req: NextRequest): Promise<NextResponse | null> {
    // Get client IP
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';

    // Check if IP is blocked
    if (this.blockedIPs.has(ip) || await redis.exists(`blocked_ip:${ip}`)) {
      await this.logSuspiciousActivity(ip, 'Blocked IP attempted access');
      return new NextResponse(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate user agent
    const userAgent = req.headers.get('user-agent') || '';
    if (!this.isValidUserAgent(userAgent) && !this.isWhitelistedIP(ip)) {
      await this.logSuspiciousActivity(ip, 'Invalid user agent');
      return new NextResponse(JSON.stringify({ error: 'Invalid user agent' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check rate limiting
    if (await this.isRateLimited(ip)) {
      await this.logSuspiciousActivity(ip, 'Rate limit exceeded');
      return new NextResponse(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate session and roles
    const session = await getServerSession();
    if (!session?.user || !SECURITY_CONFIG.requiredRoles.includes(session.user.role)) {
      await this.logSuspiciousActivity(ip, 'Unauthorized access attempt');
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate request body for POST/PUT requests
    if (['POST', 'PUT'].includes(req.method)) {
      if (!await this.validateRequest(req)) {
        await this.logSuspiciousActivity(ip, 'Invalid request body');
        return new NextResponse(JSON.stringify({ error: 'Invalid request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Generate request signature
    const signature = this.generateRequestSignature(req);
    
    // Add security headers
    const headers = new Headers({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Request-Signature': signature,
    });

    // Clone the request with security headers
    const secureRequest = new NextRequest(req.url, {
      method: req.method,
      headers: headers,
      body: req.body,
    });

    return null; // Continue to next middleware/handler
  }

  public async cleanup() {
    this.blockedIPs.clear();
    this.suspiciousActivities.clear();
    await redis.quit();
  }
}

// Export middleware function
export async function withCrawlerSecurity(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const security = CrawlerSecurity.getInstance();
  const securityResponse = await security.middleware(req);
  
  if (securityResponse) {
    return securityResponse;
  }

  try {
    return await handler(req);
  } catch (error) {
    console.error('Error in crawler request:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 