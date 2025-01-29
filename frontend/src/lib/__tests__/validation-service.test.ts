import { ValidationService } from '../services/ValidationService';
import { OrderStatus, UserRole } from '@prisma/client';

describe('ValidationService', () => {
  const baseContext = {
    userId: 'user123',
    orderId: 'order123',
    metadata: {},
  };

  describe('validateTransition', () => {
    it('should allow valid transitions', async () => {
      const context = {
        ...baseContext,
        userRole: UserRole.ADMIN,
        currentStatus: OrderStatus.PENDING,
        targetStatus: OrderStatus.PROCESSING,
      };

      const result = await ValidationService.validateTransition(context);
      expect(result).toBeNull();
    });

    it('should reject invalid transitions', async () => {
      const context = {
        ...baseContext,
        userRole: UserRole.ADMIN,
        currentStatus: OrderStatus.PENDING,
        targetStatus: OrderStatus.DELIVERED,
      };

      const result = await ValidationService.validateTransition(context);
      expect(result).toEqual({
        message: 'Invalid transition from PENDING to DELIVERED',
        code: 'INVALID_TRANSITION',
      });
    });

    it('should enforce role permissions', async () => {
      const context = {
        ...baseContext,
        userRole: UserRole.CUSTOMER,
        currentStatus: OrderStatus.PENDING,
        targetStatus: OrderStatus.PROCESSING,
      };

      const result = await ValidationService.validateTransition(context);
      expect(result).toEqual({
        message: 'User role CUSTOMER cannot transition to PROCESSING',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    });

    it('should validate pooling requirements', async () => {
      const context = {
        ...baseContext,
        userRole: UserRole.ADMIN,
        currentStatus: OrderStatus.PENDING,
        targetStatus: OrderStatus.POOLING,
      };

      const result = await ValidationService.validateTransition(context);
      expect(result).toEqual({
        message: 'Missing quantity information for pooling',
        code: 'INVALID_POOLING_DATA',
      });
    });

    it('should validate shipping requirements', async () => {
      const context = {
        ...baseContext,
        userRole: UserRole.SUPPLIER,
        currentStatus: OrderStatus.CONFIRMED,
        targetStatus: OrderStatus.SHIPPED,
      };

      const result = await ValidationService.validateTransition(context);
      expect(result).toEqual({
        message: 'Tracking number is required',
        code: 'MISSING_TRACKING_NUMBER',
      });
    });
  });

  describe('getAvailableTransitions', () => {
    it('should return correct transitions for admin', () => {
      const transitions = ValidationService.getAvailableTransitions(
        OrderStatus.PENDING,
        UserRole.ADMIN
      );
      expect(transitions).toEqual(['POOLING', 'PROCESSING', 'CANCELLED']);
    });

    it('should return correct transitions for supplier', () => {
      const transitions = ValidationService.getAvailableTransitions(
        OrderStatus.CONFIRMED,
        UserRole.SUPPLIER
      );
      expect(transitions).toEqual(['SHIPPED']);
    });

    it('should return only cancellation for customer', () => {
      const transitions = ValidationService.getAvailableTransitions(
        OrderStatus.PENDING,
        UserRole.CUSTOMER
      );
      expect(transitions).toEqual(['CANCELLED']);
    });

    it('should return empty array for terminal states', () => {
      const transitions = ValidationService.getAvailableTransitions(
        OrderStatus.DELIVERED,
        UserRole.ADMIN
      );
      expect(transitions).toEqual([]);
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for each status', () => {
      const color = ValidationService.getStatusColor(OrderStatus.PROCESSING);
      expect(color).toBe('#e65003'); // OrangeDarker
    });

    it('should return grey for unknown status', () => {
      const color = ValidationService.getStatusColor('UNKNOWN' as OrderStatus);
      expect(color).toBe('#999999'); // GreyDarker
    });
  });
}); 