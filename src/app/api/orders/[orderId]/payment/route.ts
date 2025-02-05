import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Role, PaymentMethod, PaymentStatus } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        product: true,
        payment: true,
        user: true,
      },
    });

    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order payment:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        product: true,
        payment: true,
      },
    });

    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    if (order.payment) {
      return new NextResponse('Payment already exists', { status: 400 });
    }

    // Calculate total amount
    const totalAmount = order.quantity * order.product.price;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: session.user.id,
        amount: totalAmount,
        status: PaymentStatus.PENDING,
        method: PaymentMethod.CREDIT_CARD,
      },
    });

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Error creating payment:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 