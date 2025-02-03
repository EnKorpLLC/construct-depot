import { PrismaClient, Role, Invitation, InviteStatus, InvitationTemplate, BatchStatus, CompanyVerification, VerificationStatus, InvitationBatch } from '@prisma/client';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email';
import { Redis } from 'ioredis';

interface BatchInvitation {
  email: string;
  role: Role;
  company?: string;
}

export class InvitationService {
  private prisma: PrismaClient;
  private redis: Redis;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async isRateLimited(ip: string): Promise<boolean> {
    const key = `invite_rate_limit:${ip}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 3600); // 1 hour window
    }
    return count > 10; // 10 invitations per hour per IP
  }

  async createTemplate(data: {
    name: string;
    subject: string;
    body: string;
    role: Role;
    onboardingSteps: string[];
    createdById: string;
    isDefault?: boolean;
  }): Promise<InvitationTemplate> {
    if (data.isDefault) {
      // Ensure only one default template per role
      await this.prisma.invitationTemplate.updateMany({
        where: {
          role: data.role,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    return this.prisma.invitationTemplate.create({
      data,
    });
  }

  async createInvitation(data: {
    email: string;
    role: Role;
    invitedById: string;
    templateId?: string;
    company?: string;
  }): Promise<Invitation> {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Check for existing invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        email: data.email,
        status: InviteStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new Error('An active invitation already exists for this email');
    }

    // Get template
    const template = data.templateId 
      ? await this.prisma.invitationTemplate.findUnique({
          where: { id: data.templateId },
        })
      : await this.prisma.invitationTemplate.findFirst({
          where: {
            role: data.role,
            isDefault: true,
          },
        });

    // Create invitation
    const invitation = await this.prisma.invitation.create({
      data: {
        email: data.email,
        role: data.role,
        token,
        expiresAt,
        invitedById: data.invitedById,
        templateId: template?.id,
      },
    });

    // Send invitation email using template if available
    await this.sendInvitationEmail(invitation, template);

    return invitation;
  }

  async createBatchInvitations(data: {
    name: string;
    invitations: BatchInvitation[];
    createdById: string;
    templateId?: string;
  }): Promise<InvitationBatch> {
    const batch = await this.prisma.invitationBatch.create({
      data: {
        name: data.name,
        createdById: data.createdById,
        templateId: data.templateId,
        status: BatchStatus.PROCESSING,
      },
    });

    try {
      for (const invite of data.invitations) {
        try {
          const invitation = await this.createInvitation({
            ...invite,
            invitedById: data.createdById,
            templateId: data.templateId,
          });

          await this.prisma.invitation.update({
            where: { id: invitation.id },
            data: { batchId: batch.id },
          });
        } catch (error) {
          console.error(`Failed to create invitation for ${invite.email}:`, error);
        }
      }

      await this.prisma.invitationBatch.update({
        where: { id: batch.id },
        data: { status: BatchStatus.COMPLETED },
      });
    } catch (error) {
      await this.prisma.invitationBatch.update({
        where: { id: batch.id },
        data: { status: BatchStatus.FAILED },
      });
      throw error;
    }

    return batch;
  }

  async verifyInvitation(token: string): Promise<Invitation> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    if (invitation.status !== InviteStatus.PENDING) {
      throw new Error('Invitation is no longer valid');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InviteStatus.EXPIRED },
      });
      throw new Error('Invitation has expired');
    }

    return invitation;
  }

  async acceptInvitation(token: string, userData: {
    name: string;
    password: string;
    company?: {
      name: string;
      registrationNo?: string;
      website?: string;
    };
  }): Promise<void> {
    const invitation = await this.verifyInvitation(token);

    // Create user account
    const user = await this.prisma.user.create({
      data: {
        email: invitation.email,
        name: userData.name,
        password: userData.password,
        role: invitation.role,
      },
    });

    // Create company verification if company data provided
    if (userData.company) {
      await this.prisma.companyVerification.create({
        data: {
          userId: user.id,
          companyName: userData.company.name,
          registrationNo: userData.company.registrationNo,
          website: userData.company.website,
          status: VerificationStatus.PENDING,
        },
      });
    }

    // Update invitation status
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InviteStatus.ACCEPTED },
    });
  }

  async cancelInvitation(id: string, cancelledById: string): Promise<void> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
      include: { invitedBy: true },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.invitedById !== cancelledById) {
      throw new Error('Unauthorized to cancel this invitation');
    }

    await this.prisma.invitation.update({
      where: { id },
      data: { status: InviteStatus.CANCELLED },
    });
  }

  private async sendInvitationEmail(invitation: Invitation, template?: InvitationTemplate | null): Promise<void> {
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${invitation.token}`;
    
    const subject = template?.subject || 'Invitation to Join Construction Depot';
    const body = template?.body || `
      <h1>You've been invited!</h1>
      <p>You've been invited to join Construction Depot as a ${invitation.role.toLowerCase().replace('_', ' ')}.</p>
      <p>Click the link below to accept the invitation:</p>
      <a href="${inviteUrl}">${inviteUrl}</a>
      <p>This invitation will expire in 7 days.</p>
    `;

    await sendEmail({
      to: invitation.email,
      subject,
      html: body.replace('{{inviteUrl}}', inviteUrl),
    });
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
    await this.redis.quit();
  }
} 