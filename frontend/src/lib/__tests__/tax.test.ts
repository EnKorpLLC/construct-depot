import { TaxCalculationService } from '../tax';
import { prisma } from '../prisma';

// Mock Prisma client
jest.mock('../prisma', () => ({
  prisma: {
    stateTaxRate: {
      findUnique: jest.fn(),
    },
  },
}));

describe('TaxCalculationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateTax', () => {
    it('should calculate tax correctly for a non-exempt purchase', async () => {
      // Mock tax rate lookup
      (prisma.stateTaxRate.findUnique as jest.Mock).mockResolvedValue({
        state: 'California',
        stateCode: 'CA',
        rate: 0.0725,
      });

      const result = await TaxCalculationService.calculateTax({
        subtotal: 100,
        stateCode: 'CA',
      });

      expect(result).toEqual({
        subtotal: 100,
        taxRate: 0.0725,
        taxAmount: 7.25,
        total: 107.25,
        state: 'California',
        stateCode: 'CA',
      });
    });

    it('should return no tax for tax-exempt purchases', async () => {
      const result = await TaxCalculationService.calculateTax({
        subtotal: 100,
        stateCode: 'CA',
        isExempt: true,
        exemptionNumber: 'TEST123',
      });

      expect(result).toEqual({
        subtotal: 100,
        taxRate: 0,
        taxAmount: 0,
        total: 100,
        state: '',
        stateCode: 'CA',
      });
    });

    it('should handle states with no sales tax', async () => {
      (prisma.stateTaxRate.findUnique as jest.Mock).mockResolvedValue({
        state: 'Oregon',
        stateCode: 'OR',
        rate: 0,
      });

      const result = await TaxCalculationService.calculateTax({
        subtotal: 100,
        stateCode: 'OR',
      });

      expect(result).toEqual({
        subtotal: 100,
        taxRate: 0,
        taxAmount: 0,
        total: 100,
        state: 'Oregon',
        stateCode: 'OR',
      });
    });

    it('should throw error for invalid state code', async () => {
      (prisma.stateTaxRate.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        TaxCalculationService.calculateTax({
          subtotal: 100,
          stateCode: 'XX',
        })
      ).rejects.toThrow('No tax rate found for state: XX');
    });
  });

  describe('validateExemptionNumber', () => {
    it('should validate correct exemption number format', () => {
      expect(TaxCalculationService.validateExemptionNumber('ABC123')).toBe(true);
      expect(TaxCalculationService.validateExemptionNumber('123456')).toBe(true);
      expect(TaxCalculationService.validateExemptionNumber('ABC12345')).toBe(true);
    });

    it('should reject invalid exemption number format', () => {
      expect(TaxCalculationService.validateExemptionNumber('ABC')).toBe(false);
      expect(TaxCalculationService.validateExemptionNumber('12')).toBe(false);
      expect(TaxCalculationService.validateExemptionNumber('')).toBe(false);
      expect(TaxCalculationService.validateExemptionNumber('ABC 123')).toBe(false);
    });
  });

  describe('getStateTaxRate', () => {
    it('should return correct tax rate for valid state', async () => {
      (prisma.stateTaxRate.findUnique as jest.Mock).mockResolvedValue({
        state: 'New York',
        stateCode: 'NY',
        rate: 0.04,
      });

      const rate = await TaxCalculationService.getStateTaxRate('NY');
      expect(rate).toBe(0.04);
    });

    it('should throw error for invalid state', async () => {
      (prisma.stateTaxRate.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        TaxCalculationService.getStateTaxRate('XX')
      ).rejects.toThrow('No tax rate found for state: XX');
    });
  });
}); 