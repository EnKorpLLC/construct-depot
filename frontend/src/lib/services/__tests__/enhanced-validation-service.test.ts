import { EnhancedValidationService } from '../EnhancedValidationService';
import { ValidationError } from '@/lib/errors';

describe('EnhancedValidationService', () => {
  let validationService: EnhancedValidationService;

  beforeEach(() => {
    validationService = new EnhancedValidationService();
  });

  describe('validateOrderData', () => {
    const validOrderData = {
      userId: 'user123',
      supplierId: 'supplier123',
      items: [
        {
          productId: 'product123',
          quantity: 10,
          unitPrice: 100
        }
      ]
    };

    it('should validate valid order data', () => {
      expect(() => validationService.validateOrderData(validOrderData)).not.toThrow();
    });

    it('should throw error for missing userId', () => {
      const invalidData = { ...validOrderData, userId: undefined };
      expect(() => validationService.validateOrderData(invalidData)).toThrow(ValidationError);
    });

    it('should throw error for missing supplierId', () => {
      const invalidData = { ...validOrderData, supplierId: undefined };
      expect(() => validationService.validateOrderData(invalidData)).toThrow(ValidationError);
    });

    it('should throw error for empty items array', () => {
      const invalidData = { ...validOrderData, items: [] };
      expect(() => validationService.validateOrderData(invalidData)).toThrow(ValidationError);
    });

    it('should throw error for invalid quantity', () => {
      const invalidData = {
        ...validOrderData,
        items: [{ ...validOrderData.items[0], quantity: 0 }]
      };
      expect(() => validationService.validateOrderData(invalidData)).toThrow(ValidationError);
    });

    it('should throw error for invalid unit price', () => {
      const invalidData = {
        ...validOrderData,
        items: [{ ...validOrderData.items[0], unitPrice: -1 }]
      };
      expect(() => validationService.validateOrderData(invalidData)).toThrow(ValidationError);
    });
  });

  describe('validatePoolData', () => {
    const validPoolData = {
      productId: 'product123',
      supplierId: 'supplier123',
      minQuantity: 100,
      pricePerUnit: 50,
      expiryDate: new Date(Date.now() + 86400000) // Tomorrow
    };

    it('should validate valid pool data', () => {
      expect(() => validationService.validatePoolData(validPoolData)).not.toThrow();
    });

    it('should throw error for invalid minimum quantity', () => {
      const invalidData = { ...validPoolData, minQuantity: 0 };
      expect(() => validationService.validatePoolData(invalidData)).toThrow(ValidationError);
    });

    it('should throw error for invalid price per unit', () => {
      const invalidData = { ...validPoolData, pricePerUnit: -1 };
      expect(() => validationService.validatePoolData(invalidData)).toThrow(ValidationError);
    });

    it('should throw error for past expiry date', () => {
      const invalidData = { 
        ...validPoolData, 
        expiryDate: new Date(Date.now() - 86400000) // Yesterday
      };
      expect(() => validationService.validatePoolData(invalidData)).toThrow(ValidationError);
    });
  });
}); 