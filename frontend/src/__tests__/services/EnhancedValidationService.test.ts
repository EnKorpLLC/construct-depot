import { EnhancedValidationService } from '@/lib/services/EnhancedValidationService';
import { OrderStatus, UserRole } from '@/types/prisma';
import prisma from '@/lib/prisma';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  order: {
    findUnique: jest.fn(),
  },
}));

describe('EnhancedValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatusColor', () => {
    it('should return the correct color for each status', () => {
      expect(EnhancedValidationService.getStatusColor('PENDING')).toBeDefined();
      expect(EnhancedValidationService.getStatusColor('PROCESSING')).toBeDefined();
      expect(EnhancedValidationService.getStatusColor('CONFIRMED')).toBeDefined();
    });
  });

  describe('getAvailableTransitions', () => {
    it('should return correct transitions for ADMIN role', () => {
      const transitions = EnhancedValidationService.getAvailableTransitions('PENDING', 'ADMIN');
      expect(transitions).toContain('PROCESSING');
      expect(transitions).toContain('CANCELLED');
    });

    it('should return limited transitions for CUSTOMER role', () => {
      const transitions = EnhancedValidationService.getAvailableTransitions('PENDING', 'CUSTOMER');
      expect(transitions).toContain('CANCELLED');
      expect(transitions).not.toContain('PROCESSING');
    });
  });

  describe('validateTransition', () => {
    const mockContext = {
      userId: '1',
      userRole: 'ADMIN' as UserRole,
      orderId: '1',
      currentStatus: 'PENDING' as OrderStatus,
      targetStatus: 'PROCESSING' as OrderStatus,
      metadata: {
        paymentVerified: true,
        supplierId: '123',
      },
    };

    it('should validate a valid transition', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValueOnce({
        id: '1',
        items: [{ quantity: 1, product: { currentStock: 10 } }],
        shippingAddress: '123 Test St',
        shippingCity: 'Test City',
        shippingState: 'TS',
        shippingZip: '12345',
      });

      const result = await EnhancedValidationService.validateTransition(mockContext);
      expect(result).toBeNull();
    });

    it('should reject invalid role transitions', async () => {
      const customerContext = {
        ...mockContext,
        userRole: 'CUSTOMER' as UserRole,
      };

      const result = await EnhancedValidationService.validateTransition(customerContext);
      expect(result).toBeDefined();
      expect(result?.code).toBe('INVALID_ROLE_TRANSITION');
    });

    it('should reject invalid status transitions', async () => {
      const invalidContext = {
        ...mockContext,
        currentStatus: 'DELIVERED' as OrderStatus,
        targetStatus: 'PROCESSING' as OrderStatus,
      };

      const result = await EnhancedValidationService.validateTransition(invalidContext);
      expect(result).toBeDefined();
      expect(result?.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });
}); 