import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { AuthType } from '@/services/crawler/types';

const prisma = new PrismaClient();

// Validation schemas
const selectorsSchema = z.object({
  product: z.string(),
  name: z.string(),
  price: z.string(),
  description: z.string(),
  image: z.string(),
});

const configurationSchema = z.object({
  name: z.string().min(1),
  supplierId: z.string().uuid(),
  authType: z.nativeEnum(AuthType),
  startUrl: z.string().url(),
  selectors: selectorsSchema,
});

// GET /api/admin/crawler/config
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const configurations = await prisma.crawlerConfiguration.findMany({
      include: {
        supplier: true,
      },
      orderBy: {
        lastUsed: 'desc',
      },
    });

    return NextResponse.json(configurations);
  } catch (error) {
    console.error('Error fetching crawler configurations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/crawler/config
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validatedData = configurationSchema.parse(body);

    const supplier = await prisma.supplier.findUnique({
      where: { id: validatedData.supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    const configuration = await prisma.crawlerConfiguration.create({
      data: {
        name: validatedData.name,
        supplierId: validatedData.supplierId,
        authType: validatedData.authType,
        startUrl: validatedData.startUrl,
        selectors: validatedData.selectors,
        lastUsed: new Date(),
      },
      include: {
        supplier: true,
      },
    });

    return NextResponse.json(configuration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating crawler configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/crawler/config
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const validatedData = configurationSchema.partial().parse(updateData);

    const configuration = await prisma.crawlerConfiguration.findUnique({
      where: { id },
    });

    if (!configuration) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    const updatedConfiguration = await prisma.crawlerConfiguration.update({
      where: { id },
      data: validatedData,
      include: {
        supplier: true,
      },
    });

    return NextResponse.json(updatedConfiguration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating crawler configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/crawler/config
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const configuration = await prisma.crawlerConfiguration.findUnique({
      where: { id },
    });

    if (!configuration) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    await prisma.crawlerConfiguration.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting crawler configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 