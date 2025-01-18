import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all orders in POOLING status
    const pooledOrders = await prisma.order.findMany({
      where: {
        status: 'POOLING',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Group orders by product
    const productPools = new Map<string, any>();

    for (const order of pooledOrders) {
      const item = order.items[0]; // Each pooled order has only one item
      const product = item.product;

      if (!productPools.has(product.id)) {
        productPools.set(product.id, {
          id: product.id,
          name: product.name,
          currentQuantity: 0,
          targetQuantity: product.minOrderQuantity,
          price: item.priceAtTime,
          orders: [],
        });
      }

      const pool = productPools.get(product.id);
      pool.currentQuantity += item.quantity;
      pool.orders.push({
        id: order.id,
        user: {
          name: order.user.name,
        },
        quantity: item.quantity,
      });
    }

    // Convert pools to array and calculate progress
    const pools = Array.from(productPools.values()).map(pool => ({
      ...pool,
      progress: Math.min(100, (pool.currentQuantity / pool.targetQuantity) * 100),
    }));

    return NextResponse.json({ pools });
  } catch (error) {
    console.error('Error fetching active pools:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 