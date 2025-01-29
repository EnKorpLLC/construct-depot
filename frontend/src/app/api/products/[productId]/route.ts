import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '../../auth/[...nextauth]/route';

// Validation schema for updates
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  minOrderQuantity: z.number().int().positive().optional(),
  unit: z.string().min(1).optional(),
  categories: z.array(z.string()).optional(),
  specifications: z.record(z.any()).optional(),
  markup: z.number().min(1).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  reorderQuantity: z.number().int().min(0).optional(),
  taxCode: z.string().optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

// GET - Get product details
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

    const product = await prisma.product.findUnique({
      where: {
        id: params.productId,
        isActive: true
      },
      include: {
        supplier: {
          select: {
            name: true,
            company: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT - Update product
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

    // Only supplier who owns the product or admin can update
    if (product.supplierId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = updateProductSchema.parse(body);

    const updatedProduct = await prisma.product.update({
      where: { id: params.productId },
      data: validatedData,
      include: {
        supplier: {
          select: {
            name: true,
            company: true
          }
        }
      }
    });

    // Log product update
    await prisma.activityLog.create({
      data: {
        type: 'PRODUCT_UPDATE',
        userId: session.user.id,
        metadata: {
          productId: params.productId,
          productName: updatedProduct.name,
          changes: validatedData,
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (soft delete)
export async function DELETE(
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
      select: { supplierId: true, name: true }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Only supplier who owns the product or admin can delete
    if (product.supplierId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.product.update({
      where: { id: params.productId },
      data: { isActive: false }
    });

    // Log product deletion
    await prisma.activityLog.create({
      data: {
        type: 'PRODUCT_DELETE',
        userId: session.user.id,
        metadata: {
          productId: params.productId,
          productName: product.name,
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 