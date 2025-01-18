import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../[...nextauth]/route';
import { generateSecret, generateTOTP } from 'node-2fa';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate MFA secret
    const { secret, qr } = generateSecret({
      name: 'Bulk Buyer Group',
      account: session.user.email
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex')
    );

    // Hash backup codes for storage
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => hash(code, 12))
    );

    // Store MFA data
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaSecret: secret,
        mfaEnabled: false, // Will be enabled after verification
        mfaBackupCodes: hashedBackupCodes
      }
    });

    // Log MFA setup initiation
    await prisma.authEvent.create({
      data: {
        type: 'MFA_SETUP_INIT',
        userId: session.user.id,
        metadata: {
          userAgent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      secret,
      qrCode: qr,
      backupCodes
    });
  } catch (error) {
    console.error('[API] MFA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup MFA' },
      { status: 500 }
    );
  }
} 