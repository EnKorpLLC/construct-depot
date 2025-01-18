import { EnhancedValidationService } from '../EnhancedValidationService';
import { OrderStatus, UserRole } from '@prisma/client';
import { prismaMock } from '../../../__tests__/mocks/prisma';

describe('EnhancedValidationService', () => {
  const mockOrder = {
    id: '1',
    status: OrderStatus.PENDING,
    userId: 'user1',
    user: {
      id: 'user1',
      role: UserRole.CUSTOMER,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.order.findUnique.mockResolvedValue(mockOrder);
  });

  describe('validateTransition', () => {
    it('should allow valid transitions', async () => {
      const validContext = {
        orderId: '1',
        currentStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.PROCESSING,
        userRole: UserRole.ADMIN,
      };

      const result = await EnhancedValidationService.validateTransition(validContext);
      expect(result).toBeNull();
    });

    it('should reject invalid role transitions', async () => {
      const customerContext = {
        orderId: '1',
        currentStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.PROCESSING,
        userRole: UserRole.CUSTOMER,
      };

      const result = await EnhancedValidationService.validateTransition(customerContext);
      expect(result).toBeDefined();
      expect(result?.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should reject invalid status transitions', async () => {
      const invalidContext = {
        orderId: '1',
        currentStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.DELIVERED,
        userRole: UserRole.ADMIN,
      };

      const result = await EnhancedValidationService.validateTransition(invalidContext);
      expect(result).toBeDefined();
      expect(result?.code).toBe('INVALID_TRANSITION');
    });
  });
}); 