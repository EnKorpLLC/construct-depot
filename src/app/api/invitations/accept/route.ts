import { NextResponse } from 'next/server';
import { InvitationService } from '@/services/invitation/InvitationService';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, name, password } = body;

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const invitationService = new InvitationService();
    
    // Hash password before storing
    const hashedPassword = await hash(password, 12);
    
    await invitationService.acceptInvitation(token, {
      name,
      password: hashedPassword,
    });

    return NextResponse.json({
      message: 'Invitation accepted successfully',
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept invitation' },
      { status: 500 }
    );
  }
} 