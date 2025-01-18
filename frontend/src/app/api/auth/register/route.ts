import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/types/auth';
import { UserRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: UserRole.USER,
        emailVerified: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Create verification token
    const verificationToken = await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: crypto.randomUUID(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    // TODO: Send verification email
    // This would typically use your email service
    console.log('Verification token:', verificationToken.token);

    // Log registration event
    await prisma.authEvent.create({
      data: {
        type: 'REGISTER',
        userId: user.id,
        metadata: {
          userAgent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('[API] Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
} 