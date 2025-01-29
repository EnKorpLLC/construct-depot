import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

// Schema for adding items to cart
const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          include: {
            supplier: {
              select: {
                name: true,
                company: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ items: cartItems });
  } catch (error) {
    console.error('Error in cart API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = addToCartSchema.parse(body);

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
      where: {
        id: validatedData.productId,
        active: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if quantity meets minimum order quantity
    if (validatedData.quantity < product.minOrderQuantity) {
      return NextResponse.json(
        { error: 'Quantity must meet minimum order quantity' },
        { status: 400 }
      );
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: session.user.id,
        productId: validatedData.productId,
      },
    });

    if (existingItem) {
      // Update quantity if item exists
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + validatedData.quantity,
        },
        include: {
          product: {
            include: {
              supplier: {
                select: {
                  name: true,
                  company: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json(updatedItem);
    }

    // Create new cart item
    const cartItem = await prisma.cartItem.create({
      data: {
        userId: session.user.id,
        productId: validatedData.productId,
        quantity: validatedData.quantity,
      },
      include: {
        product: {
          include: {
            supplier: {
              select: {
                name: true,
                company: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(cartItem);
  } catch (error) {
    console.error('Error in cart API:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 