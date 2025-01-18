import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import VerificationEmail from '@/emails/VerificationEmail';
import ResetPasswordEmail from '@/emails/ResetPasswordEmail';
import MFABackupCodesEmail from '@/emails/MFABackupCodesEmail';

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async sendMail(options: nodemailer.SendMailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@bulkbuyergroup.com',
        ...options
      });
    } catch (error) {
      console.error('[EmailService] sendMail error:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string
  ): Promise<void> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;
    const html = render(VerificationEmail({ name, url: verificationUrl }));

    await this.sendMail({
      to,
      subject: 'Verify your email address',
      html
    });
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string
  ): Promise<void> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
    const html = render(ResetPasswordEmail({ name, url: resetUrl }));

    await this.sendMail({
      to,
      subject: 'Reset your password',
      html
    });
  }

  async sendMFABackupCodesEmail(
    to: string,
    name: string,
    backupCodes: string[]
  ): Promise<void> {
    const html = render(MFABackupCodesEmail({ name, backupCodes }));

    await this.sendMail({
      to,
      subject: 'Your MFA Backup Codes',
      html
    });
  }
} 