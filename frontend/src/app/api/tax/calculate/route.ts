import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { TaxCalculationService } from '@/lib/tax';

// Validation schema for tax calculation request
const taxCalculationSchema = z.object({
  subtotal: z.number().min(0),
  stateCode: z.string().length(2),
  isExempt: z.boolean().optional(),
  exemptionNumber: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = taxCalculationSchema.parse(body);

    const result = await TaxCalculationService.calculateTax(validatedData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating tax:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to calculate tax' },
      { status: 500 }
    );
  }
} 