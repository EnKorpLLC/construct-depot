import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { InvitationService } from '@/services/invitation/InvitationService';
import { Role } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role || !Object.values(Role).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const invitationService = new InvitationService();
    const invitation = await invitationService.createInvitation({
      email,
      role,
      invitedById: session.user.id,
    });

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Invitation creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invitationService = new InvitationService();
    const prisma = new PrismaClient();
    
    const invitations = await prisma.invitation.findMany({
      where: {
        invitedById: session.user.id,
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    const invitationService = new InvitationService();
    await invitationService.cancelInvitation(invitationId, session.user.id);

    return NextResponse.json({
      message: 'Invitation cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel invitation' },
      { status: 500 }
    );
  }
} 