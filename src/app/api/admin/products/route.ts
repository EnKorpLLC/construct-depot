import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  
  try {
    const product = await prisma.product.create({
      data: {
        ...data,
        isSystemProduct: true,
        priceBrackets: {
          create: data.priceBrackets || []
        }
      },
      include: {
        priceBrackets: true
      }
    });
    
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const { id, priceBrackets, ...productData } = data;
  
  try {
    // Delete existing price brackets
    await prisma.priceBracket.deleteMany({
      where: { productId: id }
    });

    // Update product and create new price brackets
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...productData,
        priceBrackets: {
          create: priceBrackets || []
        }
      },
      include: {
        priceBrackets: true
      }
    });
    
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    // Delete price brackets first due to foreign key constraint
    await prisma.priceBracket.deleteMany({
      where: { productId: id }
    });

    // Then delete the product
    await prisma.product.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
} 