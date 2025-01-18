import { ValidationService } from '../services/ValidationService';
import { OrderStatus, UserRole } from '@prisma/client';

describe('ValidationService', () => {
  describe('getAvailableTransitions', () => {
    it('should return valid transitions for PENDING status', () => {
      const transitions = ValidationService.getAvailableTransitions(
        OrderStatus.PENDING,
        UserRole.ADMIN
      );
      expect(transitions).toContain(OrderStatus.PROCESSING);
      expect(transitions).toContain(OrderStatus.CANCELLED);
    });

    it('should return limited transitions for customer role', () => {
      const transitions = ValidationService.getAvailableTransitions(
        OrderStatus.PENDING,
        UserRole.CUSTOMER
      );
      expect(transitions).toContain(OrderStatus.CANCELLED);
      expect(transitions).not.toContain(OrderStatus.PROCESSING);
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
    it('should allow valid transitions', () => {
      const result = ValidationService.validateStatusTransition(
        OrderStatus.PENDING,
        OrderStatus.PROCESSING,
        UserRole.ADMIN
      );
      expect(result).toBe(true);
    });

    it('should reject invalid transitions', () => {
      const result = ValidationService.validateStatusTransition(
        OrderStatus.DELIVERED,
        OrderStatus.PROCESSING,
        UserRole.ADMIN
      );
      expect(result).toBe(false);
    });

    it('should reject unauthorized transitions', () => {
      const result = ValidationService.validateStatusTransition(
        OrderStatus.PENDING,
        OrderStatus.PROCESSING,
        UserRole.CUSTOMER
      );
      expect(result).toBe(false);
    });
  });
}); 