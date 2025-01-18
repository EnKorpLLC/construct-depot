import { NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/order/OrderService';
import { ValidationError } from '@/lib/errors';

const orderService = OrderService.getInstance();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const poolGroup = await orderService.createPoolGroup(body);
    return NextResponse.json(poolGroup);
  } catch (error) {
    console.error('Error in POST /api/orders/pools:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create pool group' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, poolGroupId } = body;

    const order = await orderService.joinPool(orderId, poolGroupId);
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error in PATCH /api/orders/pools:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to join pool' },
      { status: 500 }
    );
  }
} 