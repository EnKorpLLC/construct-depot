import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Redis } from 'ioredis';
import { CrawlerSecurity, withCrawlerSecurity } from '../../middleware/crawler-security';

// Mock Redis
jest.mock('ioredis');

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('CrawlerSecurity Middleware', () => {
  let security: CrawlerSecurity;
  let mockRedis: jest.Mocked<Redis>;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Redis instance
    mockRedis = {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(0),
      setex: jest.fn().mockResolvedValue('OK'),
      quit: jest.fn().mockResolvedValue('OK'),
    } as unknown as jest.Mocked<Redis>;
    
    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedis);
    
    // Get security instance
    security = CrawlerSecurity.getInstance();
  });
  
  afterEach(async () => {
    await security.cleanup();
  });
  
  describe('Request Validation', () => {
    it('should allow valid requests', async () => {
      // Mock session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' }
      });
      
      // Create mock request
      const req = new NextRequest('https://api.example.com/crawler', {
        method: 'GET',
        headers: {
          'user-agent': 'BulkBuyerBot/1.0',
          'x-forwarded-for': '127.0.0.1'
        }
      });
      
      const handler = jest.fn().mockResolvedValue(
        new NextResponse(JSON.stringify({ success: true }))
      );
      
      const response = await withCrawlerSecurity(req, handler);
      
      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });
    
    it('should block invalid user agents', async () => {
      const req = new NextRequest('https://api.example.com/crawler', {
        method: 'GET',
        headers: {
          'user-agent': 'InvalidBot',
          'x-forwarded-for': '127.0.0.1'
        }
      });
      
      const handler = jest.fn();
      
      const response = await withCrawlerSecurity(req, handler);
      
      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
    });
    
    it('should enforce rate limits', async () => {
      // Mock Redis to simulate rate limit exceeded
      mockRedis.incr.mockResolvedValue(61);
      
      const req = new NextRequest('https://api.example.com/crawler', {
        method: 'GET',
        headers: {
          'user-agent': 'BulkBuyerBot/1.0',
          'x-forwarded-for': '127.0.0.1'
        }
      });
      
      const handler = jest.fn();
      
      const response = await withCrawlerSecurity(req, handler);
      
      expect(response.status).toBe(429);
      expect(handler).not.toHaveBeenCalled();
    });
  });
  
  describe('Authentication and Authorization', () => {
    it('should block unauthorized access', async () => {
      // Mock session with invalid role
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'USER' }
      });
      
      const req = new NextRequest('https://api.example.com/crawler', {
        method: 'GET',
        headers: {
          'user-agent': 'BulkBuyerBot/1.0',
          'x-forwarded-for': '127.0.0.1'
        }
      });
      
      const handler = jest.fn();
      
      const response = await withCrawlerSecurity(req, handler);
      
      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });
    
    it('should block access without session', async () => {
      // Mock no session
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const req = new NextRequest('https://api.example.com/crawler', {
        method: 'GET',
        headers: {
          'user-agent': 'BulkBuyerBot/1.0',
          'x-forwarded-for': '127.0.0.1'
        }
      });
      
      const handler = jest.fn();
      
      const response = await withCrawlerSecurity(req, handler);
      
      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });
  });
  
  describe('Request Body Validation', () => {
    it('should validate POST request body', async () => {
      // Mock valid session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' }
      });
      
      const req = new NextRequest('https://api.example.com/crawler', {
        method: 'POST',
        headers: {
          'user-agent': 'BulkBuyerBot/1.0',
          'x-forwarded-for': '127.0.0.1',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          targetUrl: 'https://example.com',
          rateLimit: 50,
          schedule: '*/5 * * * *',
          selectors: {
            product: '.product'
          }
        })
      });
      
      const handler = jest.fn().mockResolvedValue(
        new NextResponse(JSON.stringify({ success: true }))
      );
      
      const response = await withCrawlerSecurity(req, handler);
      
      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });
    
    it('should reject invalid POST request body', async () => {
      // Mock valid session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' }
      });
      
      const req = new NextRequest('https://api.example.com/crawler', {
        method: 'POST',
        headers: {
          'user-agent': 'BulkBuyerBot/1.0',
          'x-forwarded-for': '127.0.0.1',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          targetUrl: 'invalid-url',
          rateLimit: -1,
          schedule: 'invalid-schedule',
          selectors: null
        })
      });
      
      const handler = jest.fn();
      
      const response = await withCrawlerSecurity(req, handler);
      
      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
    });
  });
  
  describe('IP Blocking', () => {
    it('should block previously blocked IPs', async () => {
      // Mock Redis to simulate blocked IP
      mockRedis.exists.mockResolvedValue(1);
      
      const req = new NextRequest('https://api.example.com/crawler', {
        method: 'GET',
        headers: {
          'user-agent': 'BulkBuyerBot/1.0',
          'x-forwarded-for': '127.0.0.1'
        }
      });
      
      const handler = jest.fn();
      
      const response = await withCrawlerSecurity(req, handler);
      
      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });
    
    it('should block IP after multiple suspicious activities', async () => {
      // Mock valid session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' }
      });
      
      const req = new NextRequest('https://api.example.com/crawler', {
        method: 'POST',
        headers: {
          'user-agent': 'BulkBuyerBot/1.0',
          'x-forwarded-for': '127.0.0.1',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ invalid: 'body' })
      });
      
      const handler = jest.fn();
      
      // Simulate multiple invalid requests
      for (let i = 0; i < 5; i++) {
        await withCrawlerSecurity(req, handler);
      }
      
      // Check if IP is blocked after multiple attempts
      const response = await withCrawlerSecurity(req, handler);
      
      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'blocked_ip:127.0.0.1',
        86400,
        '1'
      );
    });
  });
  
  describe('Error Handling', () => {
    it('should handle handler errors gracefully', async () => {
      // Mock valid session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' }
      });
      
      const req = new NextRequest('https://api.example.com/crawler', {
        method: 'GET',
        headers: {
          'user-agent': 'BulkBuyerBot/1.0',
          'x-forwarded-for': '127.0.0.1'
        }
      });
      
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));
      
      const response = await withCrawlerSecurity(req, handler);
      
      expect(response.status).toBe(500);
      expect(JSON.parse(await response.text())).toEqual({
        error: 'Internal server error'
      });
    });
  });
}); 