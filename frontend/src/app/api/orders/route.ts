import { NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/order/OrderService';
import { ValidationError } from '@/lib/errors';

const orderService = OrderService.getInstance();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status');
    const poolGroupId = searchParams.get('poolGroupId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await orderService.listOrders({
      userId: userId || undefined,
      supplierId: supplierId || undefined,
      status: status as any || undefined,
      poolGroupId: poolGroupId || undefined,
      page,
      limit
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await orderService.createOrder(body);
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error in POST /api/orders:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 