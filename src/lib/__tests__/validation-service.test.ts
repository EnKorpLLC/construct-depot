import { ValidationService } from '../services/ValidationService';
import { OrderStatus, Role } from '@prisma/client';

describe('ValidationService', () => {
  describe('getAvailableTransitions', () => {
    it('should return valid transitions for PENDING status', () => {
      const transitions = ValidationService.getAvailableTransitions(
        OrderStatus.PENDING,
        Role.super_admin
      );
      expect(transitions).toContain(OrderStatus.PROCESSING);
      expect(transitions).toContain(OrderStatus.CANCELLED);
    });

    it('should return limited transitions for customer role', () => {
      const transitions = ValidationService.getAvailableTransitions(
        OrderStatus.PENDING,
        Role.user
      );
      expect(transitions).toContain(OrderStatus.CANCELLED);
      expect(transitions).not.toContain(OrderStatus.PROCESSING);
    });

    it('should return empty array for terminal states', () => {
      const transitions = ValidationService.getAvailableTransitions(
        OrderStatus.DELIVERED,
        Role.super_admin
      );
      expect(transitions).toEqual([]);
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for each status', () => {
      expect(ValidationService.getStatusColor(OrderStatus.PENDING)).toBeDefined();
      expect(ValidationService.getStatusColor(OrderStatus.PROCESSING)).toBeDefined();
      expect(ValidationService.getStatusColor(OrderStatus.DELIVERED)).toBeDefined();
      expect(ValidationService.getStatusColor(OrderStatus.CANCELLED)).toBeDefined();
    });

    it('should return grey for unknown status', () => {
      const color = ValidationService.getStatusColor('UNKNOWN' as OrderStatus);
      expect(color).toBe('#333333');
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow admin to make any valid transition', () => {
      const result = ValidationService.validateStatusTransition(
        OrderStatus.PENDING,
        OrderStatus.PROCESSING,
        Role.super_admin
      );
      expect(result).toBe(true);
    });

    it('should return limited transitions for customer role', () => {
      const result = ValidationService.validateStatusTransition(
        OrderStatus.PENDING,
        OrderStatus.CANCELLED,
        Role.user
      );
      expect(result).toBe(true);
    });

    it('should reject invalid transitions for admin', () => {
      expect(() =>
        ValidationService.validateStatusTransition(
          OrderStatus.COMPLETED,
          OrderStatus.PENDING,
          Role.super_admin
        )
      ).toThrow('Invalid status transition');
    });
  });
}); 