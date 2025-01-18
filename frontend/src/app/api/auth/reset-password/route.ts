import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resetPasswordSchema } from '@/types/auth';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Hash the provided token for comparison
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        expires: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(password, 12);

    // Update user password
    const user = await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
        passwordResetTokens: {
          deleteMany: { userId: resetToken.userId }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true
      }
    });

    // Log password reset
    await prisma.authEvent.create({
      data: {
        type: 'PASSWORD_RESET',
        userId: user.id,
        metadata: {
          userAgent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('[API] Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
} 