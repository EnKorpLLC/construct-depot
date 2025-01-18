import { NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/order/OrderService';
import { ValidationError, NotFoundError } from '@/lib/errors';

const orderService = OrderService.getInstance();

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const order = await orderService.getOrder(params.orderId);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error in GET /api/orders/[orderId]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = await request.json();
    const { status, userId, notes } = body;

    const order = await orderService.updateOrderStatus(
      params.orderId,
      status,
      userId,
      notes
    );

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error in PATCH /api/orders/[orderId]:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
} 