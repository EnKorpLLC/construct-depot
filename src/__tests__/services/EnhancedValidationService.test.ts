import { EnhancedValidationService } from '@/services/validation';
import { ValidationRule, ValidationError } from '@/types/validation';
import { generateValidationError } from '../mocks/data-generators';

describe('EnhancedValidationService', () => {
  let validationService: EnhancedValidationService;

  beforeEach(() => {
    // @ts-ignore - Reset the singleton instance
    EnhancedValidationService.instance = undefined;
    validationService = EnhancedValidationService.getInstance();
  });

  describe('Basic Validation', () => {
    describe('validateEmail', () => {
      it('should validate correct email format', () => {
        expect(validationService.validateEmail('user@example.com')).toBe(true);
      });

      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'invalid-email',
          'user@',
          '@domain.com',
          'user@.com',
          'user@domain.',
          'user@domain@com'
        ];

        invalidEmails.forEach(email => {
          expect(validationService.validateEmail(email)).toBe(false);
        });
      });

      it('should handle edge cases', () => {
        expect(validationService.validateEmail('')).toBe(false);
        expect(validationService.validateEmail('a@b.c')).toBe(false); // Too short
        expect(validationService.validateEmail('a'.repeat(256) + '@example.com')).toBe(false); // Too long
      });
    });

    describe('validatePassword', () => {
      it('should validate strong passwords', () => {
        expect(validationService.validatePassword('StrongP@ss123')).toBe(true);
      });

      it('should reject weak passwords', () => {
        const weakPasswords = [
          'short',
          'onlylowercase',
          'ONLYUPPERCASE',
          '12345678',
          'nospecialchars123',
          'NoNumbers!'
        ];

        weakPasswords.forEach(password => {
          expect(validationService.validatePassword(password)).toBe(false);
        });
      });

      it('should enforce minimum length', () => {
        expect(validationService.validatePassword('Sh@rt1')).toBe(false);
      });
    });
  });

  describe('Schema Validation', () => {
    const userSchema = {
      name: { type: 'string', required: true, minLength: 2 },
      age: { type: 'number', required: true, min: 18 },
      email: { type: 'email', required: true },
      preferences: { type: 'object', required: false }
    };

    it('should validate valid user data', () => {
      const validUser = {
        name: 'John Doe',
        age: 25,
        email: 'john@example.com',
        preferences: { theme: 'dark' }
      };

      const result = validationService.validateSchema(validUser, userSchema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch missing required fields', () => {
      const invalidUser = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const result = validationService.validateSchema(invalidUser, userSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'age',
          code: 'REQUIRED'
        })
      );
    });

    it('should validate nested objects', () => {
      const nestedSchema = {
        user: {
          type: 'object',
          required: true,
          schema: userSchema
        }
      };

      const validData = {
        user: {
          name: 'John Doe',
          age: 25,
          email: 'john@example.com'
        }
      };

      const result = validationService.validateSchema(validData, nestedSchema);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Custom Rules', () => {
    it('should apply custom validation rules', () => {
      const customRule: ValidationRule = {
        name: 'isEven',
        validate: (value: number) => value % 2 === 0,
        errorMessage: 'Number must be even'
      };

      validationService.addCustomRule(customRule);

      const schema = {
        number: { type: 'number', required: true, customRules: ['isEven'] }
      };

      const validData = { number: 2 };
      const invalidData = { number: 3 };

      expect(validationService.validateSchema(validData, schema).isValid).toBe(true);
      expect(validationService.validateSchema(invalidData, schema).isValid).toBe(false);
    });

    it('should handle multiple custom rules', () => {
      const rules: ValidationRule[] = [
        {
          name: 'isPositive',
          validate: (value: number) => value > 0,
          errorMessage: 'Number must be positive'
        },
        {
          name: 'isLessThan100',
          validate: (value: number) => value < 100,
          errorMessage: 'Number must be less than 100'
        }
      ];

      rules.forEach(rule => validationService.addCustomRule(rule));

      const schema = {
        number: {
          type: 'number',
          required: true,
          customRules: ['isPositive', 'isLessThan100']
        }
      };

      expect(validationService.validateSchema({ number: 50 }, schema).isValid).toBe(true);
      expect(validationService.validateSchema({ number: -1 }, schema).isValid).toBe(false);
      expect(validationService.validateSchema({ number: 150 }, schema).isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should format validation errors correctly', () => {
      const schema = {
        name: { type: 'string', required: true, minLength: 2 },
        age: { type: 'number', required: true, min: 18 }
      };

      const invalidData = {
        name: 'J',
        age: 15
      };

      const result = validationService.validateSchema(invalidData, schema);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.any(String),
            code: 'MIN_LENGTH'
          }),
          expect.objectContaining({
            field: 'age',
            message: expect.any(String),
            code: 'MIN_VALUE'
          })
        ])
      );
    });

    it('should handle undefined values', () => {
      const schema = {
        name: { type: 'string', required: false }
      };

      const result = validationService.validateSchema({}, schema);
      expect(result.isValid).toBe(true);
    });

    it('should handle null values', () => {
      const schema = {
        name: { type: 'string', required: false, nullable: true }
      };

      const result = validationService.validateSchema({ name: null }, schema);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large objects efficiently', () => {
      const largeObject = Array(1000).fill(null).reduce((acc, _, index) => {
        acc[`field${index}`] = `value${index}`;
        return acc;
      }, {});

      const largeSchema = Object.keys(largeObject).reduce((acc, key) => {
        acc[key] = { type: 'string', required: true };
        return acc;
      }, {});

      const startTime = Date.now();
      const result = validationService.validateSchema(largeObject, largeSchema);
      const endTime = Date.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should validate within 1 second
    });

    it('should handle circular references', () => {
      const circularObject: any = {
        name: 'Test',
        reference: null
      };
      circularObject.reference = circularObject;

      const schema = {
        name: { type: 'string', required: true },
        reference: { type: 'object', required: true }
      };

      expect(() => validationService.validateSchema(circularObject, schema))
        .not.toThrow();
    });

    it('should handle deeply nested objects', () => {
      const createNestedObject = (depth: number) => {
        let obj: any = { value: 'test' };
        let current = obj;
        for (let i = 0; i < depth; i++) {
          current.nested = { value: 'test' };
          current = current.nested;
        }
        return obj;
      };

      const createNestedSchema = (depth: number) => {
        let schema: any = { value: { type: 'string', required: true } };
        let current = schema;
        for (let i = 0; i < depth; i++) {
          current.nested = {
            type: 'object',
            required: true,
            schema: { value: { type: 'string', required: true } }
          };
          current = current.nested.schema;
        }
        return schema;
      };

      const nestedObject = createNestedObject(10);
      const nestedSchema = createNestedSchema(10);

      const result = validationService.validateSchema(nestedObject, nestedSchema);
      expect(result.isValid).toBe(true);
    });
  });
}); 