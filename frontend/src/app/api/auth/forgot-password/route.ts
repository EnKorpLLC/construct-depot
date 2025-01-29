import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema } from '@/types/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Return success even if user doesn't exist for security
      return NextResponse.json({
        message: 'If an account exists, a password reset email will be sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Store reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    });

    // TODO: Send password reset email with token
    // This would typically use your email service
    console.log('Reset token:', resetToken);

    // Log password reset request
    await prisma.authEvent.create({
      data: {
        type: 'PASSWORD_RESET_REQUEST',
        userId: user.id,
        metadata: {
          userAgent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      message: 'If an account exists, a password reset email will be sent'
    });
  } catch (error) {
    console.error('[API] Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
} 