import { NextRequest, NextResponse } from 'next/server';
import { updateUserSchema } from '@/types/admin';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: params.userId },
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
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[API] Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    // If password is being updated, hash it
    const updates = {
      ...validatedData,
      ...(validatedData.password && {
        password: await hash(validatedData.password, 12)
      })
    };

    const user = await prisma.adminUser.update({
      where: { id: params.userId },
      data: updates,
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
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('[API] Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check if user exists
    const user = await prisma.adminUser.findUnique({
      where: { id: params.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Instead of deleting, mark as inactive
    await prisma.adminUser.update({
      where: { id: params.userId },
      data: { status: 'INACTIVE' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 