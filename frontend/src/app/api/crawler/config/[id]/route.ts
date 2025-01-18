import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateConfigSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  targetUrl: z.string().url().optional(),
  schedule: z.string().optional(),
  rateLimit: z.number().min(1).max(60).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403 }
    );
  }

  try {
    const config = await prisma.crawlerConfig.findUnique({
      where: { id: params.id },
    });

    if (!config) {
      return new NextResponse(
        JSON.stringify({ error: 'Configuration not found' }),
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching crawler config:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403 }
    );
  }

  try {
    const json = await request.json();
    const data = updateConfigSchema.parse(json);

    const config = await prisma.crawlerConfig.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid input', details: error.errors }),
        { status: 400 }
      );
    }

    console.error('Error updating crawler config:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403 }
    );
  }

  try {
    await prisma.crawlerConfig.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting crawler config:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
} 