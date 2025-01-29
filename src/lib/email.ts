import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

interface EmailConfig {
  email: string;
  password: string;
  host: string;
  port: string;
  secure: boolean;
}

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedConfig: EmailConfig | null = null;

export async function getEmailConfig(): Promise<EmailConfig | null> {
  if (cachedConfig) return cachedConfig;

  try {
    const config = await prisma.serviceConfig.findUnique({
      where: { service: 'email' },
    });

    if (!config) return null;

    const decryptedConfig = JSON.parse(decrypt(config.config as string)) as EmailConfig;
    cachedConfig = decryptedConfig;
    return decryptedConfig;
  } catch (error) {
    console.error('Error fetching email config:', error);
    return null;
  }
}

async function createTransporter(): Promise<nodemailer.Transporter | null> {
  const config = await getEmailConfig();
  if (!config) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: parseInt(config.port),
    secure: config.secure,
    auth: {
      user: config.email,
      pass: config.password,
    },
    tls: {
      ciphers: 'SSLv3',
    },
  });
}

async function getTransporter(): Promise<nodemailer.Transporter | null> {
  if (cachedTransporter) {
    try {
      await cachedTransporter.verify();
      return cachedTransporter;
    } catch (error) {
      cachedTransporter = null;
    }
  }

  cachedTransporter = await createTransporter();
  return cachedTransporter;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    if (!transporter || !cachedConfig) {
      throw new Error('Email configuration not found');
    }

    await transporter.sendMail({
      from: cachedConfig.email,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html,
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      throw new Error('Email configuration not found');
    }

    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Error testing email connection:', error);
    return false;
  }
}

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to Bulk Buyer Group',
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>Thank you for joining Bulk Buyer Group. We're excited to have you on board!</p>
      <p>Get started by:</p>
      <ul>
        <li>Completing your profile</li>
        <li>Browsing available pool groups</li>
        <li>Creating your first order</li>
      </ul>
    `,
  }),

  orderConfirmation: (orderDetails: any) => ({
    subject: `Order Confirmation #${orderDetails.id}`,
    html: `
      <h1>Order Confirmation</h1>
      <p>Thank you for your order!</p>
      <h2>Order Details</h2>
      <p>Order ID: ${orderDetails.id}</p>
      <p>Total: $${orderDetails.totalAmount}</p>
      <div style="margin-top: 20px;">
        <h3>Items</h3>
        ${orderDetails.items.map((item: any) => `
          <div>
            <p>${item.name} x ${item.quantity}</p>
            <p>$${item.price}</p>
          </div>
        `).join('')}
      </div>
    `,
  }),

  passwordReset: (resetLink: string) => ({
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  }),
}; 