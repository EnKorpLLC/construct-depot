import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '../../../auth/[...nextauth]/route';

// Validation schemas
const updateStockSchema = z.object({
  adjustment: z.number().int(),
  type: z.enum(['RESTOCK', 'SALE', 'ADJUSTMENT', 'RETURN']),
  reason: z.string().optional(),
  reference: z.string().optional()
});

const updateSettingsSchema = z.object({
  lowStockThreshold: z.number().int().min(0),
  reorderPoint: z.number().int().min(0),
  reorderQuantity: z.number().int().min(0)
});

// Helper function to calculate inventory status
function calculateInventoryStatus(currentStock: number, lowStockThreshold: number): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (currentStock <= 0) return 'OUT_OF_STOCK';
  if (currentStock <= lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

// PATCH - Update stock levels
export async function PATCH(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      select: {
        supplierId: true,
        currentStock: true,
        lowStockThreshold: true,
        unit: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Only supplier who owns the product or admin can update stock
    if (product.supplierId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { adjustment, type, reason, reference } = updateStockSchema.parse(body);

    // Calculate new stock level
    const newStock = product.currentStock + adjustment;
    if (newStock < 0) {
      return NextResponse.json(
        {
          error: 'Insufficient stock',
          details: {
            currentStock: product.currentStock,
            requestedAdjustment: adjustment,
            unit: product.unit
          }
        },
        { status: 400 }
      );
    }

    // Update stock in a transaction
    const [updatedProduct, inventoryLog] = await prisma.$transaction([
      prisma.product.update({
        where: { id: params.productId },
        data: {
          currentStock: newStock,
          inventoryStatus: calculateInventoryStatus(newStock, product.lowStockThreshold),
          lastRestockDate: type === 'RESTOCK' ? new Date() : undefined
        }
      }),
      prisma.inventoryLog.create({
        data: {
          productId: params.productId,
          type,
          quantity: adjustment,
          reason,
          reference,
          createdBy: session.user.id
        }
      })
    ]);

    // Log inventory update
    await prisma.activityLog.create({
      data: {
        type: 'INVENTORY_UPDATE',
        userId: session.user.id,
        metadata: {
          productId: params.productId,
          adjustment,
          type,
          newStock,
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      product: updatedProduct,
      log: inventoryLog
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

// GET - Get inventory history
export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') as 'RESTOCK' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | undefined;
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;

    // Build where clause
    const where: any = {
      productId: params.productId
    };

    if (type) {
      where.type = type;
    }

    if (from || to) {
      where.createdAt = {
        ...(from && { gte: from }),
        ...(to && { lte: to })
      };
    }

    // Get inventory logs with pagination
    const [logs, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              name: true,
              unit: true
            }
          },
          createdByUser: {
            select: {
              name: true,
              role: true
            }
          }
        }
      }),
      prisma.inventoryLog.count({ where })
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory history' },
      { status: 500 }
    );
  }
}

// PUT - Update inventory settings
export async function PUT(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      select: { supplierId: true }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Only supplier who owns the product or admin can update settings
    if (product.supplierId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = updateSettingsSchema.parse(body);

    const updatedProduct = await prisma.product.update({
      where: { id: params.productId },
      data: validatedData
    });

    // Log settings update
    await prisma.activityLog.create({
      data: {
        type: 'INVENTORY_SETTINGS_UPDATE',
        userId: session.user.id,
        metadata: {
          productId: params.productId,
          changes: validatedData,
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error('Error updating inventory settings:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update inventory settings' },
      { status: 500 }
    );
  }
} 