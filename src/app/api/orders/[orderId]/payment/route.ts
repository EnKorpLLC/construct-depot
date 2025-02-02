import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Role } from '@prisma/client';

export async function POST(
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
      }
    }
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Only allow users to pay for their own orders
  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate order status
  if (order.status !== OrderStatus.PENDING) {
    return NextResponse.json({
      error: 'Order cannot be paid in current status'
    }, { status: 400 });
  }

  const data = await request.json();
  const { paymentMethod, paymentDetails } = data;

  if (!paymentMethod || !paymentDetails) {
    return NextResponse.json({
      error: 'Payment method and details are required'
    }, { status: 400 });
  }

  // Process payment (mock implementation)
  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: order.items.reduce((total, item) => total + item.price * item.quantity, 0),
      method: paymentMethod,
      transactionId: paymentDetails.transactionId || 'mock-transaction-id',
      status: 'COMPLETED',
      userId: session.user.id,
    }
  });

  // Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.PROCESSING },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  return NextResponse.json({
    order: updatedOrder,
    payment
  });
} 