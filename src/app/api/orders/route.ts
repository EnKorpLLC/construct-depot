import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Role } from '@prisma/client';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || undefined;
  const status = searchParams.get('status') as OrderStatus | undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  const where = {
    ...(userId && { userId }),
    ...(status && { status }),
  };

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          product: true,
          user: true,
          pool: true,
          payment: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const { productId, quantity, poolId } = data;

  if (!productId || !quantity) {
    return NextResponse.json({ error: 'Product ID and quantity are required' }, { status: 400 });
  }

  // Validate product exists and has sufficient quantity
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 400 });
  }

  if (product.inventory < quantity) {
    return NextResponse.json({
      error: 'Insufficient quantity',
      available: product.inventory
    }, { status: 400 });
  }

  // Calculate total amount
  const totalAmount = quantity * product.price;

  // Create order
  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      productId,
      quantity,
      totalAmount,
      poolId,
      status: poolId ? OrderStatus.POOLING : OrderStatus.PENDING
    },
    include: {
      product: true,
      user: true,
      pool: true
    }
  });

  // If part of a pool, update pool's current quantity
  if (poolId) {
    await prisma.pool.update({
      where: { id: poolId },
      data: {
        currentQuantity: {
          increment: quantity
        }
      }
    });
  }

  return NextResponse.json(order);
} 