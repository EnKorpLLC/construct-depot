import { describe, expect, it } from '@jest/globals';
import { validateEmail, validatePassword, validateOrderData, sanitizeInput } from '../../../src/utils/validation';

describe('Validation Utilities', () => {
  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@nodomain.com')).toBe(false);
      expect(validateEmail('no@domain')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
      expect(validatePassword('Complex@Pass456')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
      expect(validatePassword('nouppercaseornumber')).toBe(false);
    });
  });

  describe('Order Data Validation', () => {
    it('should validate complete order data', () => {
      const validOrder = {
        userId: '123',
        items: [{ productId: '1', quantity: 2 }],
        shippingAddress: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          zip: '12345'
        }
      };
      expect(validateOrderData(validOrder)).toBe(true);
    });

    it('should reject incomplete order data', () => {
      const invalidOrder = {
        userId: '123',
        items: [] // Empty items
      };
      expect(validateOrderData(invalidOrder)).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize strings with potential XSS', () => {
      const input = '<script>alert("xss")</script>';
      expect(sanitizeInput(input)).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });

    it('should handle special characters', () => {
      const input = '&<>"\'';
      expect(sanitizeInput(input)).toBe('&amp;&lt;&gt;"\'');
    });

    it('should preserve valid input', () => {
      const input = 'Normal text 123';
      expect(sanitizeInput(input)).toBe('Normal text 123');
    });
  });
}); 