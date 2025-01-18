import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { crawlTargetSchema } from '@/types/crawler';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = crawlTargetSchema.parse(body);

    const target = await prisma.crawlTarget.create({
      data: {
        ...validatedData,
        isActive: true,
        userId: session.user.id
      }
    });

    return NextResponse.json(target, { status: 201 });
  } catch (error) {
    console.error('[API] Create target error:', error);
    return NextResponse.json(
      { error: 'Failed to create target' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isActive = searchParams.get('isActive');

    const where = {
      userId: session.user.id,
      ...(isActive !== null && { isActive: isActive === 'true' })
    };

    const [targets, total] = await Promise.all([
      prisma.crawlTarget.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.crawlTarget.count({ where })
    ]);

    return NextResponse.json({
      targets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[API] List targets error:', error);
    return NextResponse.json(
      { error: 'Failed to list targets' },
      { status: 500 }
    );
  }
} 