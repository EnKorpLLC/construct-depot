import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only suppliers and admins can view all pools
  const allowedRoles = [Role.supplier, Role.admin, Role.super_admin] as const;
  if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const pools = await prisma.pool.findMany({
      include: {
        product: {
          select: {
            name: true,
            price: true,
            unit: true,
          },
        },
        orders: {
          select: {
            id: true,
            quantity: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
    });

    return NextResponse.json({ pools });
  } catch (error) {
    console.error('Error fetching pools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pools' },
      { status: 500 }
    );
  }
} 