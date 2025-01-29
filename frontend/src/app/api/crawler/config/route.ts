import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const crawlerConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  targetUrl: z.string().url(),
  schedule: z.string().optional(),
  rateLimit: z.number().min(1).max(60),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403 }
    );
  }

  const configs = await prisma.crawlerConfig.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403 }
    );
  }

  try {
    const json = await request.json();
    const data = crawlerConfigSchema.parse(json);

    const config = await prisma.crawlerConfig.create({
      data: {
        ...data,
        status: 'idle',
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid input', details: error.errors }),
        { status: 400 }
      );
    }

    console.error('Crawler config creation error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
} 