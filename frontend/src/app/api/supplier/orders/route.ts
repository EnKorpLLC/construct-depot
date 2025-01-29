import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { OrderService } from '@/lib/orders';
import { authOptions } from '../../auth/[...nextauth]/route';

// Validation schemas
const updateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

const updatePooledOrderStatusSchema = z.object({
  pooledOrderId: z.string(),
  status: z.enum(['PROCESSING', 'COMPLETED', 'CANCELLED']),
});

// GET - Get supplier orders or pooled orders
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (type === 'pooled') {
      const pooledOrders = await OrderService.getSupplierPooledOrders(session.user.id);
      return NextResponse.json(pooledOrders);
    }

    const orders = await OrderService.getUserOrders(
      session.user.id,
      'SUPPLIER',
      status || undefined,
      limit,
      offset,
    );

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error in orders GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update order status
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Handle pooled order status update
    if ('pooledOrderId' in body) {
      const { pooledOrderId, status } = updatePooledOrderStatusSchema.parse(body);
      const result = await OrderService.updatePooledOrderStatus(pooledOrderId, status);
      return NextResponse.json(result);
    }

    // Handle individual order status update
    const { orderId, status } = updateOrderStatusSchema.parse(body);
    const result = await OrderService.updateOrderStatus(orderId, status, session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in orders PATCH:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 