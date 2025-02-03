import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

interface InventoryUpdate {
  productId: string;
  variantId?: string;
  quantity: number;
  type: 'set' | 'increment' | 'decrement';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== Role.supplier && session.user.role !== Role.admin && session.user.role !== Role.super_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = (await request.json()) as InventoryUpdate[];
    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const update of updates) {
      try {
        // Verify product ownership
        const product = await prisma.product.findUnique({
          where: { id: update.productId },
          select: { supplierId: true },
        });

        if (!product) {
          results.failed.push({
            id: update.productId,
            error: 'Product not found',
          });
          continue;
        }

        if (product.supplierId !== session.user.id && 
            session.user.role !== Role.admin && 
            session.user.role !== Role.super_admin) {
          results.failed.push({
            id: update.productId,
            error: 'Unauthorized',
          });
          continue;
        }

        // Update inventory
        if (update.variantId) {
          // Update variant inventory
          const variant = await prisma.productVariant.findUnique({
            where: { id: update.variantId },
          });

          if (!variant || variant.productId !== update.productId) {
            results.failed.push({
              id: `${update.productId}:${update.variantId}`,
              error: 'Variant not found or does not belong to product',
            });
            continue;
          }

          const newQuantity = update.type === 'set' 
            ? update.quantity 
            : update.type === 'increment'
              ? variant.inventory + update.quantity
              : variant.inventory - update.quantity;

          if (newQuantity < 0) {
            results.failed.push({
              id: `${update.productId}:${update.variantId}`,
              error: 'Insufficient inventory',
            });
            continue;
          }

          await prisma.productVariant.update({
            where: { id: update.variantId },
            data: { inventory: newQuantity },
          });
        } else {
          // Update product inventory
          const product = await prisma.product.findUnique({
            where: { id: update.productId },
          });

          if (!product) {
            results.failed.push({
              id: update.productId,
              error: 'Product not found',
            });
            continue;
          }

          const newQuantity = update.type === 'set'
            ? update.quantity
            : update.type === 'increment'
              ? product.inventory + update.quantity
              : product.inventory - update.quantity;

          if (newQuantity < 0) {
            results.failed.push({
              id: update.productId,
              error: 'Insufficient inventory',
            });
            continue;
          }

          await prisma.product.update({
            where: { id: update.productId },
            data: { inventory: newQuantity },
          });
        }

        results.success.push(update.variantId 
          ? `${update.productId}:${update.variantId}`
          : update.productId
        );
      } catch (error) {
        console.error('Inventory update error:', error);
        results.failed.push({
          id: update.variantId 
            ? `${update.productId}:${update.variantId}`
            : update.productId,
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Inventory update error:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== Role.supplier && session.user.role !== Role.admin && session.user.role !== Role.super_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId') || session.user.id;
    const lowStock = parseInt(searchParams.get('lowStock') || '0');

    // Verify permission to view other supplier's inventory
    if (supplierId !== session.user.id && 
        session.user.role !== Role.admin && 
        session.user.role !== Role.super_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get products with low inventory
    const products = await prisma.product.findMany({
      where: {
        supplierId,
        OR: [
          { inventory: { lte: lowStock } },
          {
            variants: {
              some: {
                inventory: { lte: lowStock },
              },
            },
          },
        ],
      },
      include: {
        variants: {
          where: {
            inventory: { lte: lowStock },
          },
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
} 