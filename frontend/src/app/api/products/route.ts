import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '../auth/[...nextauth]/route';

// Validation schemas
const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be positive"),
  minOrderQuantity: z.number().int().positive("Minimum order quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  categories: z.array(z.string()),
  specifications: z.record(z.any()).optional(),
  markup: z.number().min(1).default(1.2),
  currentStock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  reorderPoint: z.number().int().min(0).default(20),
  reorderQuantity: z.number().int().min(0).default(50),
  taxCode: z.string().optional(),
  images: z.array(z.string()).default([])
});

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  inStock: z.string().transform(val => val === 'true').optional()
});

// GET - List products with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const {
      page,
      limit,
      category,
      search,
      minPrice,
      maxPrice,
      inStock
    } = querySchema.parse(Object.fromEntries(searchParams));

    // Build where clause
    const where: any = {
      isActive: true
    };

    if (category) {
      where.categories = { has: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice && { gte: minPrice }),
        ...(maxPrice && { lte: maxPrice })
      };
    }

    if (inStock !== undefined) {
      where.currentStock = inStock ? { gt: 0 } : { equals: 0 };
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: {
            select: {
              name: true,
              company: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPPLIER') {
      return NextResponse.json(
        { error: 'Only suppliers can create products' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        supplierId: session.user.id,
        inventoryStatus: validatedData.currentStock > validatedData.lowStockThreshold ? 'IN_STOCK' : 'LOW_STOCK'
      },
      include: {
        supplier: {
          select: {
            name: true,
            company: true
          }
        }
      }
    });

    // Log product creation
    await prisma.activityLog.create({
      data: {
        type: 'PRODUCT_CREATE',
        userId: session.user.id,
        metadata: {
          productId: product.id,
          productName: product.name,
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 