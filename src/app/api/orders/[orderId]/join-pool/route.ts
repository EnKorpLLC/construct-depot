import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { orderService } from '@/lib/services/order/order.service';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// Validation schema for joining pool
const joinPoolSchema = z.object({
  poolGroupId: z.string()
});

// POST /api/orders/[orderId]/join-pool
export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { poolGroupId } = joinPoolSchema.parse(body);

    // Get order to check permissions
    const order = await orderService.getOrder(params.orderId);
    if (!order) {
      return new NextResponse(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user owns the order
    if (order.userId !== session.user.id) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updatedOrder = await orderService.joinPool(params.orderId, poolGroupId);

    return new NextResponse(JSON.stringify(updatedOrder), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error joining pool:', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: 'Invalid request data', details: error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (error instanceof ValidationError) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (error instanceof NotFoundError) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 