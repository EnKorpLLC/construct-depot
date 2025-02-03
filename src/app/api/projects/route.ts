import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== Role.general_contractor) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tradeType = searchParams.get('tradeType');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'date';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where = {
      ...(tradeType && tradeType !== 'All' ? { tradeType } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: {
          ...(sortBy === 'date' && { bidsDue: 'asc' }),
          ...(sortBy === 'budget' && { budget: 'desc' }),
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          generalContractor: {
            select: {
              id: true,
              name: true,
              company: true,
            },
          },
          _count: {
            select: { bids: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== Role.general_contractor) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const {
      title,
      description,
      location,
      tradeType,
      budget,
      startDate,
      duration,
      requirements,
      bidsDue,
      scope,
    } = data;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        location,
        tradeType,
        budget,
        startDate,
        duration,
        requirements,
        bidsDue,
        scope,
        status: 'open',
        generalContractorId: session.user.id,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 