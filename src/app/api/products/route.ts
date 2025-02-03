import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, Prisma } from '@prisma/client';

async function recordPriceChange(
  productId: string,
  oldPrice: number,
  newPrice: number,
  source: string = 'manual'
) {
  if (oldPrice !== newPrice) {
    await prisma.priceHistory.create({
      data: {
        productId,
        price: newPrice,
        source,
      },
    });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== Role.supplier && session.user.role !== Role.admin && session.user.role !== Role.super_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const basePrice = formData.get('basePrice') ? parseFloat(formData.get('basePrice') as string) : null;
    const minOrderQuantity = parseInt(formData.get('minOrderQuantity') as string);
    const categoryId = formData.get('categoryId') as string;
    const specifications = JSON.parse(formData.get('specifications') as string);
    const images = JSON.parse(formData.get('images') as string);
    const thumbnailUrl = formData.get('thumbnailUrl') as string;
    const hasVariants = formData.get('hasVariants') === 'true';
    const variants = hasVariants ? JSON.parse(formData.get('variants') as string) : [];

    const [product] = await prisma.$transaction([
      prisma.product.create({
        data: {
          name,
          description,
          price: hasVariants ? (basePrice || price) : price,
          basePrice: hasVariants ? basePrice : null,
          minOrderQuantity,
          categoryId: categoryId || undefined,
          specifications,
          thumbnailUrl,
          supplierId: session.user.id,
          hasVariants,
          inventory: hasVariants ? 0 : variants[0]?.inventory || 0,
          images: {
            create: images.map((image: any) => ({
              url: image.url,
              alt: image.alt,
              order: image.order || 0,
            })),
          },
          ...(hasVariants && {
            variants: {
              create: variants.map((variant: any) => ({
                sku: variant.sku,
                price: variant.price,
                inventory: variant.inventory,
                options: {
                  create: variant.options.map((option: any) => ({
                    name: option.name,
                    value: option.value,
                  })),
                },
              })),
            },
          }),
        },
        include: {
          images: true,
          category: true,
          variants: {
            include: {
              options: true,
            },
          },
        },
      }),
    ]);

    // Record initial price
    await recordPriceChange(product.id, 0, product.price, 'system');
    
    // Record variant prices if any
    if (hasVariants) {
      for (const variant of product.variants) {
        await recordPriceChange(product.id, 0, variant.price, 'system');
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const id = formData.get('id') as string;
    
    // Verify ownership or admin status
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (existingProduct.supplierId !== session.user.id && 
        session.user.role !== Role.admin && 
        session.user.role !== Role.super_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const basePrice = formData.get('basePrice') ? parseFloat(formData.get('basePrice') as string) : null;
    const minOrderQuantity = parseInt(formData.get('minOrderQuantity') as string);
    const categoryId = formData.get('categoryId') as string;
    const specifications = JSON.parse(formData.get('specifications') as string);
    const images = JSON.parse(formData.get('images') as string);
    const thumbnailUrl = formData.get('thumbnailUrl') as string;
    const hasVariants = formData.get('hasVariants') === 'true';
    const variants = hasVariants ? JSON.parse(formData.get('variants') as string) : [];

    // Update product with transaction to handle images, variants, and price history
    const [, , product] = await prisma.$transaction([
      prisma.productImage.deleteMany({
        where: { productId: id },
      }),
      prisma.productVariant.deleteMany({
        where: { productId: id },
      }),
      prisma.product.update({
        where: { id },
        data: {
          name,
          description,
          price: hasVariants ? (basePrice || price) : price,
          basePrice: hasVariants ? basePrice : null,
          minOrderQuantity,
          categoryId: categoryId || undefined,
          specifications,
          thumbnailUrl,
          hasVariants,
          inventory: hasVariants ? 0 : variants[0]?.inventory || 0,
          images: {
            create: images.map((image: any) => ({
              url: image.url,
              alt: image.alt,
              order: image.order || 0,
            })),
          },
          ...(hasVariants && {
            variants: {
              create: variants.map((variant: any) => ({
                sku: variant.sku,
                price: variant.price,
                inventory: variant.inventory,
                options: {
                  create: variant.options.map((option: any) => ({
                    name: option.name,
                    value: option.value,
                  })),
                },
              })),
            },
          }),
        },
        include: {
          images: true,
          category: true,
          variants: {
            include: {
              options: true,
            },
          },
        },
      }),
    ]);

    // Record price changes
    const newPrice = hasVariants ? (basePrice || price) : price;
    if (existingProduct.price !== newPrice) {
      await recordPriceChange(id, existingProduct.price, newPrice);
    }

    // Record variant price changes
    if (hasVariants) {
      const existingVariants = new Map(
        existingProduct.variants.map(v => [v.sku, v])
      );

      for (const variant of product.variants) {
        const existingVariant = existingVariants.get(variant.sku || '');
        if (!existingVariant || existingVariant.price !== variant.price) {
          await recordPriceChange(
            id,
            existingVariant?.price || 0,
            variant.price
          );
        }
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: true,
          category: true,
          variants: {
            include: {
              options: true,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Product fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 