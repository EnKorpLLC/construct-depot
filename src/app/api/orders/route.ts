import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Role, OrderStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') as OrderStatus | undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status }),
    ...(session.user.role !== Role.admin && session.user.role !== Role.super_admin && { userId: session.user.id })
  };

  const [orders, total] = await Promise.all([
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
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.count({ where })
  ]);

  return NextResponse.json({
    orders,
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
  const { items } = data;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
  }

  // Validate products exist and have sufficient quantity
  const productIds = items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: 'Some products not found' }, { status: 400 });
  }

  const insufficientProducts = products.filter(product => {
    const orderItem = items.find(item => item.productId === product.id);
    return product.inventory < (orderItem?.quantity || 0);
  });

  if (insufficientProducts.length > 0) {
    return NextResponse.json({
      error: 'Insufficient quantity',
      products: insufficientProducts
    }, { status: 400 });
  }

  // Create order
  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      totalAmount: items.reduce((total, item) => total + item.price * item.quantity, 0),
      items: {
        create: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  return NextResponse.json(order);
} 