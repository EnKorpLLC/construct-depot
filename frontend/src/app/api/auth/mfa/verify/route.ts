import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../[...nextauth]/route';
import { verifyTOTP } from 'node-2fa';
import { compare } from 'bcryptjs';
import { mfaVerifySchema, mfaBackupSchema } from '@/types/auth';

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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        mfaSecret: true,
        mfaEnabled: true,
        mfaBackupCodes: true
      }
    });

    if (!user?.mfaSecret) {
      return NextResponse.json(
        { error: 'MFA not setup' },
        { status: 400 }
      );
    }

    let isValid = false;
    let isBackupCode = false;

    // Try TOTP verification first
    try {
      const { code } = mfaVerifySchema.parse(body);
      const result = verifyTOTP(user.mfaSecret, code);
      isValid = result?.delta === 0;
    } catch {
      // If TOTP verification fails, try backup code
      try {
        const { code } = mfaBackupSchema.parse(body);
        const backupCodes = user.mfaBackupCodes || [];
        
        for (let i = 0; i < backupCodes.length; i++) {
          const isMatch = await compare(code, backupCodes[i]);
          if (isMatch) {
            isValid = true;
            isBackupCode = true;
            // Remove used backup code
            await prisma.user.update({
              where: { id: user.id },
              data: {
                mfaBackupCodes: backupCodes.filter((_, index) => index !== i)
              }
            });
            break;
          }
        }
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Enable MFA if not already enabled
    if (!user.mfaEnabled) {
      await prisma.user.update({
        where: { id: user.id },
        data: { mfaEnabled: true }
      });
    }

    // Log verification
    await prisma.authEvent.create({
      data: {
        type: isBackupCode ? 'MFA_BACKUP_VERIFY' : 'MFA_VERIFY',
        userId: user.id,
        metadata: {
          userAgent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      message: 'MFA verification successful',
      mfaEnabled: true
    });
  } catch (error) {
    console.error('[API] MFA verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify MFA' },
      { status: 500 }
    );
  }
} 