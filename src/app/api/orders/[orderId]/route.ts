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
      product: true,
      user: true,
      pool: true,
      payment: true
    }
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Only allow users to view their own orders unless they're admin
  if (order.userId !== session.user.id && session.user.role !== Role.admin && session.user.role !== Role.super_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PUT(
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
    include: {
      product: true,
      pool: true
    }
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Only allow users to update their own orders unless they're admin
  if (order.userId !== session.user.id && session.user.role !== Role.admin && session.user.role !== Role.super_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Update order
  const updatedOrder = await prisma.order.update({
    where: { id: params.orderId },
    data: { status },
    include: {
      product: true,
      user: true,
      pool: true,
      payment: true
    }
  });

  // If cancelling a pooled order, update pool quantity
  if (status === OrderStatus.CANCELLED && order.poolId) {
    await prisma.pool.update({
      where: { id: order.poolId },
      data: {
        currentQuantity: {
          decrement: order.quantity
        }
      }
    });
  }

  return NextResponse.json(updatedOrder);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.orderId }
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Only allow users to delete their own orders unless they're admin
  if (order.userId !== session.user.id && session.user.role !== Role.admin && session.user.role !== Role.super_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Only allow deletion of pending orders
  if (order.status !== OrderStatus.PENDING) {
    return NextResponse.json({ error: 'Only pending orders can be deleted' }, { status: 400 });
  }

  await prisma.order.delete({
    where: { id: params.orderId }
  });

  return NextResponse.json({ success: true });
} 