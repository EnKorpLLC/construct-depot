import { OrderStatus, Role } from '@prisma/client';
import { EnhancedValidationService } from '../EnhancedValidationService';
import { prismaMock } from '../../__tests__/mocks/prisma';

describe('EnhancedValidationService', () => {
  const mockOrder = {
    id: 'order-1',
    userId: 'user-1',
    status: OrderStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: Role.user,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTransition', () => {
    it('should allow valid transitions for admin', async () => {
      const service = new EnhancedValidationService();
      const result = await service.validateTransition({
        orderId: mockOrder.id,
        currentStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.PROCESSING,
        userRole: Role.super_admin,
      });

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid role transitions', async () => {
      const service = new EnhancedValidationService();
      const result = await service.validateTransition({
        orderId: mockOrder.id,
        currentStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.PROCESSING,
        userRole: Role.user,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Unauthorized status transition');
    });

    it('should allow admin to bypass validation', async () => {
      const service = new EnhancedValidationService();
      const result = await service.validateTransition({
        orderId: mockOrder.id,
        currentStatus: OrderStatus.COMPLETED,
        newStatus: OrderStatus.PROCESSING,
        userRole: Role.super_admin,
        bypassValidation: true,
      });

      expect(result.isValid).toBe(true);
    });
  });
}); 