import nodemailer from 'nodemailer';
import { OrderStatus } from '@prisma/client';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Authentication Emails
  static async sendVerificationEmail(to: string, verificationToken: string) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
    const subject = 'Verify Your Email Address';
    const text = `Please verify your email address by clicking the following link: ${verificationUrl}`;
    const html = `
      <h2>Email Verification</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}" style="
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 15px 32px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 4px;
      ">Verify Email</a>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
    `;

    await this.sendEmail(to, subject, text, html);
  }

  static async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your Password';
    const text = `You have requested to reset your password. Click the following link to proceed: ${resetUrl}`;
    const html = `
      <h2>Password Reset Request</h2>
      <p>You have requested to reset your password. Click the button below to proceed:</p>
      <a href="${resetUrl}" style="
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 15px 32px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 4px;
      ">Reset Password</a>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p>${resetUrl}</p>
    `;

    await this.sendEmail(to, subject, text, html);
  }

  static async sendWelcomeEmail(to: string, username: string) {
    const subject = 'Welcome to Bulk Buyer Group!';
    const text = `Welcome to Bulk Buyer Group, ${username}! We're excited to have you on board.`;
    const html = `
      <h2>Welcome to Bulk Buyer Group!</h2>
      <p>Hi ${username},</p>
      <p>We're excited to have you on board! Here are some things you can do to get started:</p>
      <ul>
        <li>Complete your profile</li>
        <li>Browse available products</li>
        <li>Join a buying pool</li>
        <li>Connect with other buyers</li>
      </ul>
      <p>If you have any questions, our support team is here to help!</p>
    `;

    await this.sendEmail(to, subject, text, html);
  }

  static async sendLoginAlertEmail(to: string, loginInfo: {
    time: string;
    location: string;
    device: string;
    ip: string;
  }) {
    const subject = 'New Login Detected';
    const text = `A new login was detected on your account at ${loginInfo.time} from ${loginInfo.location} using ${loginInfo.device}.`;
    const html = `
      <h2>New Login Detected</h2>
      <p>We detected a new login to your account with the following details:</p>
      <ul>
        <li>Time: ${loginInfo.time}</li>
        <li>Location: ${loginInfo.location}</li>
        <li>Device: ${loginInfo.device}</li>
        <li>IP Address: ${loginInfo.ip}</li>
      </ul>
      <p>If this wasn't you, please reset your password immediately and contact support.</p>
    `;

    await this.sendEmail(to, subject, text, html);
  }

  static async sendOrderStatusEmail(
    to: string,
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    items: Array<{ productName: string; quantity: number }>
  ) {
    const subject = this.getStatusChangeSubject(toStatus);
    const text = this.getStatusChangeText(orderId, fromStatus, toStatus, items);
    const html = this.getStatusChangeHtml(orderId, fromStatus, toStatus, items);

    await this.sendEmail(to, subject, text, html);
  }

  static async sendPoolProgressEmail(
    to: string,
    orderId: string,
    productName: string,
    currentQuantity: number,
    targetQuantity: number,
    remainingQuantity: number
  ) {
    const progress = Math.round((currentQuantity / targetQuantity) * 100);
    const subject = 'Pool Progress Update';
    const text = `Your pooled order #${orderId} for ${productName} is ${progress}% complete. Need ${remainingQuantity} more units to complete the pool.`;
    const html = `
      <h2>Pool Progress Update</h2>
      <p>Your pooled order #${orderId} for ${productName} is ${progress}% complete.</p>
      <p>Current quantity: ${currentQuantity} / ${targetQuantity}</p>
      <p>Need ${remainingQuantity} more units to complete the pool.</p>
    `;

    await this.sendEmail(to, subject, text, html);
  }

  static async sendPoolCompleteEmail(
    to: string,
    orderId: string,
    productName: string
  ) {
    const subject = 'Pool Complete!';
    const text = `Great news! The pool for your order #${orderId} (${productName}) is now complete. Your order will be processed soon.`;
    const html = `
      <h2>Pool Complete!</h2>
      <p>Great news! The pool for your order #${orderId} (${productName}) is now complete.</p>
      <p>Your order will be processed soon.</p>
    `;

    await this.sendEmail(to, subject, text, html);
  }

  private static async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string
  ) {
    try {
      const info = await this.transporter.sendMail({
        from: `"Bulk Buyer Group" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  private static getStatusChangeSubject(status: OrderStatus): string {
    switch (status) {
      case 'POOLING':
        return 'Order Added to Pool';
      case 'PENDING':
        return 'Order Ready for Processing';
      case 'PROCESSING':
        return 'Order Being Processed';
      case 'CONFIRMED':
        return 'Order Confirmed';
      case 'SHIPPED':
        return 'Order Shipped';
      case 'DELIVERED':
        return 'Order Delivered';
      case 'CANCELLED':
        return 'Order Cancelled';
      default:
        return 'Order Status Updated';
    }
  }

  private static getStatusChangeText(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    items: Array<{ productName: string; quantity: number }>
  ): string {
    const itemsList = items
      .map(item => `${item.quantity}x ${item.productName}`)
      .join(', ');

    switch (toStatus) {
      case 'POOLING':
        return `Your order #${orderId} for ${itemsList} has been added to a pool. We'll notify you when the pool is complete.`;
      case 'PENDING':
        return `Your pooled order #${orderId} for ${itemsList} is now complete and ready for processing.`;
      case 'PROCESSING':
        return `We've started processing your order #${orderId} for ${itemsList}.`;
      case 'CONFIRMED':
        return `Your order #${orderId} for ${itemsList} has been confirmed and will be shipped soon.`;
      case 'SHIPPED':
        return `Great news! Your order #${orderId} for ${itemsList} has been shipped.`;
      case 'DELIVERED':
        return `Your order #${orderId} for ${itemsList} has been delivered. Thank you for shopping with us!`;
      case 'CANCELLED':
        return `Your order #${orderId} for ${itemsList} has been cancelled.`;
      default:
        return `Your order #${orderId} status has been updated from ${fromStatus} to ${toStatus}.`;
    }
  }

  private static getStatusChangeHtml(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    items: Array<{ productName: string; quantity: number }>
  ): string {
    const itemsList = items
      .map(item => `${item.quantity}x ${item.productName}`)
      .join(', ');

    const message = this.getStatusChangeText(orderId, fromStatus, toStatus, items);
    return `
      <h2>${this.getStatusChangeSubject(toStatus)}</h2>
      <p>${message}</p>
      <h3>Order Details</h3>
      <ul>
        ${items.map(item => `
          <li>${item.quantity}x ${item.productName}</li>
        `).join('')}
      </ul>
    `;
  }
} 