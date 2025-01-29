import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { InventoryService } from '@/lib/inventory';
import { authOptions } from '../../auth/[...nextauth]/route';

// Validation schemas
const updateStockSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
  type: z.enum(['RESTOCK', 'SALE', 'ADJUSTMENT', 'RETURN']),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

const updateSettingsSchema = z.object({
  productId: z.string(),
  settings: z.object({
    lowStockThreshold: z.number().optional(),
    reorderPoint: z.number().optional(),
    reorderQuantity: z.number().optional(),
  }),
});

// GET - Get inventory logs or low stock products
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (type === 'logs' && productId) {
      const logs = await InventoryService.getInventoryLogs(productId, limit, offset);
      return NextResponse.json(logs);
    }

    if (type === 'low-stock') {
      const products = await InventoryService.getLowStockProducts(session.user.id);
      return NextResponse.json(products);
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error in inventory GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update stock levels
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity, type, reason, reference } = updateStockSchema.parse(body);

    const result = await InventoryService.updateStock(
      productId,
      quantity,
      type,
      session.user.id,
      reason,
      reference
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in inventory POST:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update inventory settings
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, settings } = updateSettingsSchema.parse(body);

    const result = await InventoryService.updateInventorySettings(productId, settings);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in inventory PATCH:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 