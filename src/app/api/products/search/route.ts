import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      AND: [
        // Search query
        query
          ? {
              OR: [
                { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { description: { contains: query, mode: Prisma.QueryMode.insensitive } },
              ],
            }
          : {},
        // Category filter
        categoryId ? { categoryId } : {},
        // Price range filter
        {
          AND: [
            minPrice ? { price: { gte: parseFloat(minPrice) } } : {},
            maxPrice ? { price: { lte: parseFloat(maxPrice) } } : {},
          ],
        },
      ].filter(condition => Object.keys(condition).length > 0), // Remove empty conditions
    };

    // Execute query with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
              company: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
} 