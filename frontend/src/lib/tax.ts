import { prisma } from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface TaxCalculationResult {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  state: string;
  stateCode: string;
}

export interface TaxCalculationInput {
  subtotal: number;
  stateCode: string;
  isExempt?: boolean;
  exemptionNumber?: string;
}

export class TaxCalculationService {
  /**
   * Calculate tax for an order
   */
  static async calculateTax({
    subtotal,
    stateCode,
    isExempt = false,
    exemptionNumber = null
  }: TaxCalculationInput): Promise<TaxCalculationResult> {
    // If tax exempt and has valid exemption number, return no tax
    if (isExempt && exemptionNumber) {
      return {
        subtotal,
        taxRate: 0,
        taxAmount: 0,
        total: subtotal,
        state: '',
        stateCode
      };
    }

    // Get state tax rate
    const taxRate = await prisma.stateTaxRate.findUnique({
      where: { stateCode: stateCode.toUpperCase() }
    });

    if (!taxRate) {
      throw new Error(`No tax rate found for state: ${stateCode}`);
    }

    // Calculate tax
    const rate = Number(taxRate.rate);
    const taxAmount = Number((subtotal * rate).toFixed(2));
    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxRate: rate,
      taxAmount,
      total,
      state: taxRate.state,
      stateCode: taxRate.stateCode
    };
  }

  /**
   * Validate a tax exemption number format
   * This is a basic implementation - should be enhanced based on specific requirements
   */
  static validateExemptionNumber(exemptionNumber: string): boolean {
    // Basic validation - requires at least 6 characters with numbers and letters
    return /^[A-Z0-9]{6,}$/i.test(exemptionNumber);
  }

  /**
   * Get tax rate for a state
   */
  static async getStateTaxRate(stateCode: string): Promise<number> {
    const taxRate = await prisma.stateTaxRate.findUnique({
      where: { stateCode: stateCode.toUpperCase() }
    });

    if (!taxRate) {
      throw new Error(`No tax rate found for state: ${stateCode}`);
    }

    return Number(taxRate.rate);
  }
} 