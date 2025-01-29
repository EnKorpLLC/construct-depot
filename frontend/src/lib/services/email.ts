import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { VerificationEmail } from '@/emails/VerificationEmail';
import { PasswordResetEmail } from '@/emails/PasswordResetEmail';
import { WelcomeEmail } from '@/emails/WelcomeEmail';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;
  private readonly FROM_EMAIL = process.env.SMTP_FROM || 'noreply@example.com';

  private constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.FROM_EMAIL,
        ...options,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Email sending failed');
    }
  }

  public async sendVerificationEmail(
    to: string,
    token: string,
    name: string
  ): Promise<void> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    const html = render(
      VerificationEmail({
        userFirstName: name,
        verificationUrl,
      })
    );

    await this.sendEmail({
      to,
      subject: 'Verify your email address',
      html,
    });
  }

  public async sendPasswordResetEmail(
    to: string,
    token: string,
    name: string
  ): Promise<void> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    const html = render(
      PasswordResetEmail({
        userFirstName: name,
        resetUrl,
      })
    );

    await this.sendEmail({
      to,
      subject: 'Reset your password',
      html,
    });
  }

  public async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const html = render(
      WelcomeEmail({
        userFirstName: name,
      })
    );

    await this.sendEmail({
      to,
      subject: 'Welcome to Bulk Buyer Group',
      html,
    });
  }

  // Test email configuration
  public async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}

export const emailService = EmailService.getInstance(); 