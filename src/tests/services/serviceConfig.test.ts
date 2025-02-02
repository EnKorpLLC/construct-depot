import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { encrypt, decrypt } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import * as nextAuth from 'next-auth';
import { getServerSession } from 'next-auth';
import { MockSession } from '../setup';

// Mock NextAuth
jest.mock('next-auth');

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    serviceConfig: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Service Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Encryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const testData = {
        email: 'test@example.com',
        password: 'secretpassword',
      };
      
      const encrypted = encrypt(JSON.stringify(testData));
      const decrypted = decrypt(encrypted);
      
      expect(JSON.parse(decrypted)).toEqual(testData);
    });

    it('should generate unique ciphertexts for same plaintext', () => {
      const testData = 'test data';
      
      const encrypted1 = encrypt(testData);
      const encrypted2 = encrypt(testData);
      
      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(decrypt(encrypted2));
    });
  });

  describe('Email Configuration', () => {
    const testEmailConfig = {
      email: 'test@company.com',
      host: 'smtp.office365.com',
      port: '587',
      secure: true,
    };

    it('should validate email configuration', () => {
      const isValid = validateEmailConfig(testEmailConfig);
      expect(isValid).toBe(true);
    });

    it('should reject invalid email configuration', () => {
      const invalidConfig = { ...testEmailConfig, port: 'invalid' };
      const isValid = validateEmailConfig(invalidConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('Analytics Configuration', () => {
    const testAnalyticsConfig = {
      measurementId: 'G-12345678',
      enabled: true,
      anonymizeIp: true,
    };

    it('should validate analytics configuration', () => {
      const isValid = validateAnalyticsConfig(testAnalyticsConfig);
      expect(isValid).toBe(true);
    });

    it('should reject invalid measurement ID', () => {
      const invalidConfig = { ...testAnalyticsConfig, measurementId: 'invalid' };
      const isValid = validateAnalyticsConfig(invalidConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('Security Configuration', () => {
    const testSecurityConfig = {
      rateLimiting: {
        enabled: true,
        maxRequests: 100,
        windowMs: 900000,
      },
      session: {
        maxAge: 86400,
      },
      auth: {
        mfaEnabled: true,
        passwordPolicy: 'strong',
      },
    };

    it('should validate security configuration', () => {
      const isValid = validateSecurityConfig(testSecurityConfig);
      expect(isValid).toBe(true);
    });

    it('should reject invalid rate limiting values', () => {
      const invalidConfig = {
        ...testSecurityConfig,
        rateLimiting: { ...testSecurityConfig.rateLimiting, maxRequests: -1 },
      };
      const isValid = validateSecurityConfig(invalidConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('API Endpoints', () => {
    const mockSuperAdmin: MockSession = {
      user: {
        id: 'admin-id',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'super_admin'
      }
    };

    const mockRegularUser: MockSession = {
      user: {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user'
      }
    };

    it('should allow super admin to fetch configurations', async () => {
      (nextAuth.getServerSession as jest.Mock).mockResolvedValue(mockSuperAdmin);
      (prisma.serviceConfig.findMany as jest.Mock).mockResolvedValue([]);

      const response = await GET();
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should prevent non-admin from accessing configurations', async () => {
      (nextAuth.getServerSession as jest.Mock).mockResolvedValue(mockRegularUser);

      const response = await GET();
      expect(response.status).toBe(403);
    });

    it('should save valid configuration', async () => {
      (nextAuth.getServerSession as jest.Mock).mockResolvedValue(mockSuperAdmin);
      const testConfig = {
        service: 'email',
        config: testEmailConfig,
      };

      const response = await POST(new Request('', {
        method: 'POST',
        body: JSON.stringify(testConfig),
      }));

      expect(response.status).toBe(200);
      expect(prisma.serviceConfig.upsert).toHaveBeenCalled();
    });
  });
});

// Validation helper functions
function validateEmailConfig(config: any): boolean {
  return !!(
    config.email &&
    config.email.includes('@') &&
    config.host &&
    /^\d+$/.test(config.port)
  );
}

function validateAnalyticsConfig(config: any): boolean {
  return !!(
    config.measurementId &&
    config.measurementId.startsWith('G-') &&
    typeof config.enabled === 'boolean'
  );
}

function validateSecurityConfig(config: any): boolean {
  return !!(
    config.rateLimiting &&
    typeof config.rateLimiting.enabled === 'boolean' &&
    config.rateLimiting.maxRequests > 0 &&
    config.rateLimiting.windowMs > 0 &&
    config.session &&
    config.session.maxAge > 0
  );
} 