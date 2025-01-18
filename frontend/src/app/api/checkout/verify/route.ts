import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import Stripe from 'stripe';
import { PayPalHttpClient, OrdersCaptureRequest } from '@paypal/checkout-server-sdk';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Initialize PayPal client
const environment = process.env.NODE_ENV === 'production'
  ? new PayPalHttpClient.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!
    )
  : new PayPalHttpClient.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!
    );
const paypalClient = new PayPalHttpClient(environment);

const verifySchema = z.object({
  sessionId: z.string().optional(),
  token: z.string().optional(),
  payerId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = verifySchema.parse(body);

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    let paymentSuccessful = false;
    let paymentDetails = null;

    if (validatedData.sessionId) {
      // Verify Stripe payment
      const stripeSession = await stripe.checkout.sessions.retrieve(
        validatedData.sessionId
      );

      paymentSuccessful = stripeSession.payment_status === 'paid';
      paymentDetails = {
        provider: 'stripe',
        transactionId: stripeSession.payment_intent as string,
        amount: stripeSession.amount_total! / 100, // Convert from cents
      };
    } else if (validatedData.token && validatedData.payerId) {
      // Verify PayPal payment
      const request = new OrdersCaptureRequest(validatedData.token);
      const response = await paypalClient.execute(request);

      paymentSuccessful = response.result.status === 'COMPLETED';
      paymentDetails = {
        provider: 'paypal',
        transactionId: response.result.id,
        amount: parseFloat(response.result.purchase_units[0].amount.value),
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid payment verification data' },
        { status: 400 }
      );
    }

    if (!paymentSuccessful) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Create order and order items
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        total: paymentDetails.amount,
        paymentProvider: paymentDetails.provider,
        transactionId: paymentDetails.transactionId,
        status: 'PAID',
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
    });

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error('Error in payment verification:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 