import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

const updateQuantitySchema = z.object({
  quantity: z.number().min(1),
});

export async function PATCH(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateQuantitySchema.parse(body);

    // Get cart item and check ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: params.itemId },
      include: {
        product: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    if (cartItem.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if quantity meets minimum order quantity
    if (validatedData.quantity < cartItem.product.minOrderQuantity) {
      return NextResponse.json(
        { error: 'Quantity must meet minimum order quantity' },
        { status: 400 }
      );
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: params.itemId },
      data: {
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

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error in cart item API:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get cart item and check ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: params.itemId },
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    if (cartItem.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id: params.itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in cart item API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 