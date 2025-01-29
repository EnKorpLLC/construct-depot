import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import Stripe from 'stripe';
import { PayPalHttpClient, OrdersCreateRequest } from '@paypal/checkout-server-sdk';
import { TaxCalculationService } from '@/lib/tax';

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

const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
});

const checkoutSchema = z.object({
  paymentMethod: z.enum(['stripe', 'paypal']),
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  isExempt: z.boolean().optional(),
  exemptionNumber: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = checkoutSchema.parse(body);

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

    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + Number((item.product.price * BigInt(item.quantity)).toString());
    }, 0);

    // Calculate tax
    const taxResult = await TaxCalculationService.calculateTax({
      subtotal,
      stateCode: validatedData.shippingAddress.state,
      isExempt: validatedData.isExempt,
      exemptionNumber: validatedData.exemptionNumber,
    });

    const total = taxResult.total;

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        totalAmount: total,
        subtotal: subtotal,
        taxAmount: taxResult.taxAmount,
        taxRate: taxResult.taxRate,
        isExempt: validatedData.isExempt || false,
        exemptionNumber: validatedData.exemptionNumber,
        shippingAddress: validatedData.shippingAddress.street,
        shippingCity: validatedData.shippingAddress.city,
        shippingState: validatedData.shippingAddress.state,
        shippingZip: validatedData.shippingAddress.zip,
        shippingCountry: validatedData.shippingAddress.country,
        items: {
          create: cartItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.price,
            totalPrice: item.product.price * BigInt(item.quantity),
          })),
        },
      },
    });

    if (validatedData.paymentMethod === 'stripe') {
      // Create Stripe checkout session
      const lineItems = cartItems.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
            description: item.product.description,
            images: item.product.images,
          },
          unit_amount: Number(item.product.price) * 100, // Convert to cents
        },
        quantity: item.quantity,
      }));

      // Add tax as a separate line item if applicable
      if (taxResult.taxAmount > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Sales Tax',
              description: `Tax Rate: ${(taxResult.taxRate * 100).toFixed(2)}%`,
            },
            unit_amount: Math.round(taxResult.taxAmount * 100), // Convert to cents
          },
          quantity: 1,
        });
      }

      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
        metadata: {
          orderId: order.id,
          taxAmount: taxResult.taxAmount.toString(),
          taxRate: taxResult.taxRate.toString(),
          isExempt: validatedData.isExempt ? 'true' : 'false',
          exemptionNumber: validatedData.exemptionNumber || '',
        },
      });

      return NextResponse.json({ url: stripeSession.url });
    } else {
      // Create PayPal order
      const request = new OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: total.toString(),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: subtotal.toString(),
              },
              tax_total: {
                currency_code: 'USD',
                value: taxResult.taxAmount.toString(),
              },
            },
          },
          items: cartItems.map((item) => ({
            name: item.product.name,
            unit_amount: {
              currency_code: 'USD',
              value: item.product.price.toString(),
            },
            quantity: item.quantity.toString(),
          })),
          custom_id: order.id,
        }],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
        },
      });

      const paypalOrder = await paypalClient.execute(request);
      const approveUrl = paypalOrder.result.links.find(
        (link: { rel: string }) => link.rel === 'approve'
      )?.href;

      if (!approveUrl) {
        throw new Error('PayPal approve URL not found');
      }

      return NextResponse.json({ paypalUrl: approveUrl });
    }
  } catch (error) {
    console.error('Error in checkout API:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 