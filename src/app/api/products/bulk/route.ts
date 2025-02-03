import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

interface ProductImportRow {
  name: string;
  description?: string;
  price: string;
  minOrderQuantity: string;
  categoryId?: string;
  sku?: string;
  inventory: string;
  specifications?: string;
  hasVariants?: string;
  variantName?: string;
  variantValue?: string;
  variantPrice?: string;
  variantInventory?: string;
  variantSku?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== Role.supplier && session.user.role !== Role.admin && session.user.role !== Role.super_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const csvText = await file.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    }) as ProductImportRow[];

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Group variants by product name
    const productGroups = new Map<string, {
      base: ProductImportRow;
      variants: ProductImportRow[];
    }>();

    for (const record of records) {
      if (record.hasVariants === 'true' && record.variantName) {
        const group = productGroups.get(record.name) || {
          base: record,
          variants: [],
        };
        group.variants.push(record);
        productGroups.set(record.name, group);
      } else if (!productGroups.has(record.name)) {
        productGroups.set(record.name, { base: record, variants: [] });
      }
    }

    // Process each product group
    await Promise.all(Array.from(productGroups).map(async ([name, group]) => {
      try {
        const { base, variants } = group;
        const specifications = base.specifications ? JSON.parse(base.specifications) : {};
        
        await prisma.product.create({
          data: {
            name,
            description: base.description,
            price: parseFloat(base.price),
            minOrderQuantity: parseInt(base.minOrderQuantity),
            categoryId: base.categoryId || undefined,
            specifications,
            supplierId: session.user.id,
            inventory: parseInt(base.inventory),
            hasVariants: variants.length > 0,
            variants: variants.length > 0 ? {
              create: variants.map((variant) => ({
                sku: variant.variantSku,
                price: parseFloat(variant.variantPrice || base.price),
                inventory: parseInt(variant.variantInventory || '0'),
                options: {
                  create: [
                    {
                      name: variant.variantName!,
                      value: variant.variantValue!,
                    },
                  ],
                },
              })),
            } : undefined,
          },
        });

        results.success++;
      } catch (error) {
        console.error(`Error importing product "${name}":, error`);
        results.failed++;
        results.errors.push(`Failed to import "${name}": ${(error as Error).message}`);
      }
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== Role.supplier && session.user.role !== Role.admin && session.user.role !== Role.super_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId') || session.user.id;

    // Verify permission to export other supplier's products
    if (supplierId !== session.user.id && session.user.role !== Role.admin && session.user.role !== Role.super_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { supplierId },
      include: {
        variants: {
          include: {
            options: true,
          },
        },
      },
    });

    // Transform products into CSV rows
    const rows: ProductImportRow[] = [];
    
    for (const product of products) {
      if (product.variants.length === 0) {
        // Add non-variant product
        rows.push({
          name: product.name,
          description: product.description || '',
          price: product.price.toString(),
          minOrderQuantity: product.minOrderQuantity.toString(),
          categoryId: product.categoryId || '',
          sku: '',
          inventory: product.inventory.toString(),
          specifications: product.specifications ? JSON.stringify(product.specifications) : '',
          hasVariants: 'false',
        });
      } else {
        // Add variant product base
        rows.push({
          name: product.name,
          description: product.description || '',
          price: product.price.toString(),
          minOrderQuantity: product.minOrderQuantity.toString(),
          categoryId: product.categoryId || '',
          sku: '',
          inventory: '0',
          specifications: product.specifications ? JSON.stringify(product.specifications) : '',
          hasVariants: 'true',
        });

        // Add each variant
        for (const variant of product.variants) {
          const option = variant.options[0]; // Assuming one option per variant for now
          rows.push({
            name: product.name,
            price: product.price.toString(),
            minOrderQuantity: product.minOrderQuantity.toString(),
            inventory: '0',
            hasVariants: 'true',
            variantName: option.name,
            variantValue: option.value,
            variantPrice: variant.price.toString(),
            variantInventory: variant.inventory.toString(),
            variantSku: variant.sku || '',
          });
        }
      }
    }

    // Convert to CSV
    const csv = stringify(rows, {
      header: true,
      columns: [
        'name',
        'description',
        'price',
        'minOrderQuantity',
        'categoryId',
        'sku',
        'inventory',
        'specifications',
        'hasVariants',
        'variantName',
        'variantValue',
        'variantPrice',
        'variantInventory',
        'variantSku',
      ],
    });

    // Return CSV as attachment
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=products.csv',
      },
    });
  } catch (error) {
    console.error('Bulk export error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk export' },
      { status: 500 }
    );
  }
} 