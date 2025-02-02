import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get('productId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  const where = {
    status: OrderStatus.POOLING,
    ...(productId && {
      items: {
        some: {
          productId
        }
      }
    })
  };

  const [pools, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.order.count({ where })
  ]);

  return NextResponse.json({
    pools,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const { orderId } = data;

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Only allow users to pool their own orders
  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate order status
  if (order.status !== OrderStatus.PROCESSING) {
    return NextResponse.json({
      error: 'Only processed orders can be pooled'
    }, { status: 400 });
  }

  // Update order status and set pool fields
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.POOLING,
      poolGroupId: `pool-${Date.now()}`, // Generate a unique pool group ID
      poolProgress: 0, // Initial progress
      poolDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  return NextResponse.json(updatedOrder);
} 