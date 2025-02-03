import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const variantId = searchParams.get('variantId');

    // Get product with price history
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        priceHistory: {
          where: {
            ...(startDate && {
              timestamp: { gte: new Date(startDate) },
            }),
            ...(endDate && {
              timestamp: { lte: new Date(endDate) },
            }),
          },
          orderBy: {
            timestamp: 'asc',
          },
        },
        variants: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify permission to view price history
    if (product.supplierId !== session.user.id && 
        session.user.role !== Role.admin && 
        session.user.role !== Role.super_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate price changes and trends
    const priceHistory = product.priceHistory;
    const priceChanges = priceHistory.map((record, index) => {
      const previousPrice = index > 0 ? priceHistory[index - 1].price : record.price;
      const change = record.price - previousPrice;
      const percentageChange = (change / previousPrice) * 100;

      return {
        ...record,
        change,
        percentageChange,
      };
    });

    // Calculate trends
    const trends = {
      minPrice: Math.min(...priceHistory.map(record => record.price)),
      maxPrice: Math.max(...priceHistory.map(record => record.price)),
      averagePrice: priceHistory.reduce((sum, record) => sum + record.price, 0) / priceHistory.length,
      totalChanges: priceHistory.length - 1,
      increases: priceChanges.filter(record => record.change > 0).length,
      decreases: priceChanges.filter(record => record.change < 0).length,
    };

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        currentPrice: product.price,
        variants: product.variants,
      },
      priceHistory: priceChanges,
      trends,
    });
  } catch (error) {
    console.error('Price history fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 }
    );
  }
} 