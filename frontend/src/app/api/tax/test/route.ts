import { NextResponse } from 'next/server';
import { TaxCalculationService } from '@/lib/tax';

export async function GET(req: Request) {
  try {
    // Test case 1: Regular tax calculation
    const test1 = await TaxCalculationService.calculateTax({
      subtotal: 100,
      stateCode: 'CA',
    });

    // Test case 2: Tax exempt calculation
    const test2 = await TaxCalculationService.calculateTax({
      subtotal: 100,
      stateCode: 'NY',
      isExempt: true,
      exemptionNumber: 'TEST123456',
    });

    // Test case 3: State with no sales tax
    const test3 = await TaxCalculationService.calculateTax({
      subtotal: 100,
      stateCode: 'OR',
    });

    return NextResponse.json({
      test1,
      test2,
      test3,
    });
  } catch (error) {
    console.error('Error running tax calculation tests:', error);
    return NextResponse.json(
      { error: 'Failed to run tax calculation tests' },
      { status: 500 }
    );
  }
} 