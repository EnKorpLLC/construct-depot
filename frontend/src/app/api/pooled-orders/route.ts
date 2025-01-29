import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const status = searchParams.get('status');

    const where: any = {};

    // Filter by product if provided
    if (productId) {
      where.productId = productId;
    }

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // If supplier, show only their products' pooled orders
    if (session.user.role === 'SUPPLIER') {
      where.product = {
        supplierId: session.user.id,
      };
    }

    const pooledOrders = await prisma.pooledOrder.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            description: true,
            price: true,
            minOrderQuantity: true,
            unit: true,
            images: true,
            supplier: {
              select: {
                companyName: true,
              },
            },
          },
        },
        orders: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                companyName: true,
              },
            },
            items: {
              where: {
                productId: productId || undefined,
              },
              select: {
                quantity: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate progress and add it to the response
    const pooledOrdersWithProgress = pooledOrders.map(order => {
      const progress = (order.currentQuantity / order.targetQuantity) * 100;
      const remainingQuantity = Math.max(0, order.targetQuantity - order.currentQuantity);
      
      return {
        ...order,
        progress: Math.min(100, progress),
        remainingQuantity,
        isComplete: progress >= 100,
      };
    });

    return NextResponse.json(pooledOrdersWithProgress);
  } catch (error) {
    console.error('Error fetching pooled orders:', error);
    return new Response('Error fetching pooled orders', { status: 500 });
  }
}

// Endpoint to check if a product has an open pooled order
export async function HEAD(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return new Response('Product ID is required', { status: 400 });
    }

    const openPooledOrder = await prisma.pooledOrder.findFirst({
      where: {
        productId,
        status: 'OPEN',
      },
    });

    return new Response(null, { 
      status: 200,
      headers: {
        'X-Has-Open-Order': openPooledOrder ? 'true' : 'false',
        'X-Pooled-Order-Id': openPooledOrder?.id || '',
      },
    });
  } catch (error) {
    console.error('Error checking pooled order:', error);
    return new Response('Error checking pooled order', { status: 500 });
  }
} 