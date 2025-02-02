import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Role } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: {
        include: {
          product: true
        }
      },
      user: true
    }
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Only allow users to view their own orders unless they're admin
  if (order.userId !== session.user.id && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const { status } = data;

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { user: true }
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Only allow admins to update order status
  if (session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate status transition
  if (!Object.values(OrderStatus).includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: params.orderId },
    data: { status },
    include: {
      items: {
        include: {
          product: true
        }
      },
      user: true
    }
  });

  return NextResponse.json(updatedOrder);
} 