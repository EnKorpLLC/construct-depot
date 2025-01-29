'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CheckoutSuccessPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true);
        const sessionId = searchParams.get('session_id');
        
        if (sessionId) {
          // Verify Stripe payment
          const response = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });

          if (!response.ok) {
            throw new Error('Failed to verify payment');
          }
        } else {
          // Verify PayPal payment
          const token = searchParams.get('token');
          const payerId = searchParams.get('PayerID');

          if (!token || !payerId) {
            throw new Error('Missing PayPal verification parameters');
          }

          const response = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, payerId }),
          });

          if (!response.ok) {
            throw new Error('Failed to verify payment');
          }
        }

        // Clear cart after successful payment
        await fetch('/api/cart/clear', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error verifying payment:', error);
        setError('Failed to verify payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Processing Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please wait while we verify your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Payment Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={() => router.push('/cart')}>
              Return to Cart
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            Thank you for your order. We have received your payment and will begin
            processing your order shortly.
          </p>
          <div className="space-x-4">
            <Button onClick={() => router.push('/orders')}>
              View Orders
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/catalog')}
            >
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 