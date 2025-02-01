import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/crypto';
import { UserRole } from '@/types/next-auth';

// Helper to verify user is super admin
async function verifySuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function GET() {
  try {
    await verifySuperAdmin();
    
    const configs = await prisma.serviceConfig.findMany();
    return NextResponse.json(
      configs.map(config => ({
        ...config,
        config: decrypt(config.config as string)
      }))
    );
  } catch (error) {
    console.error('Error fetching service configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await verifySuperAdmin();
    
    const body = await request.json();
    const { service, config } = body;

    if (!service || !config) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Encrypt sensitive data before storage
    const encryptedConfig = encrypt(JSON.stringify(config));

    const serviceConfig = await prisma.serviceConfig.upsert({
      where: { service },
      update: {
        config: encryptedConfig,
        updatedAt: new Date(),
      },
      create: {
        service,
        config: encryptedConfig,
      },
    });

    return NextResponse.json({
      ...serviceConfig,
      config: config // Return decrypted config
    });
  } catch (error) {
    console.error('Error saving service config:', error);
    return NextResponse.json(
      { error: 'Failed to save service configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await verifySuperAdmin();
    
    const body = await request.json();
    const { service, lastVerified } = body;

    if (!service) {
      return NextResponse.json(
        { error: 'Missing service identifier' },
        { status: 400 }
      );
    }

    const serviceConfig = await prisma.serviceConfig.update({
      where: { service },
      data: { lastVerified: new Date() },
    });

    return NextResponse.json(serviceConfig);
  } catch (error) {
    console.error('Error updating service verification:', error);
    return NextResponse.json(
      { error: 'Failed to update service verification' },
      { status: 500 }
    );
  }
} 