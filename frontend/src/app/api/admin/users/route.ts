import { NextRequest, NextResponse } from 'next/server';
import { createUserSchema } from '@/types/admin';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createUserSchema.parse(body);

    // Hash the password
    const hashedPassword = await hash(validatedData.password, 12);

    // Create user in database
    const user = await prisma.adminUser.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: validatedData.role,
        permissions: validatedData.permissions,
        status: 'ACTIVE'
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('[API] Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const role = searchParams.get('role');

    // Build query conditions
    const where = {
      ...(status && { status }),
      ...(role && { role })
    };

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.adminUser.findMany({
        where,
        take: limit,
        skip: offset,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissions: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true
        }
      }),
      prisma.adminUser.count({ where })
    ]);

    return NextResponse.json({ users, total });
  } catch (error) {
    console.error('[API] List users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 