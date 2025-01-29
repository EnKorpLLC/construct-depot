'use client';

import { useState } from 'react';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/formatters';

interface Payment {
  status: PaymentStatus;
  method: string;
  amount: number;
}

interface OrderPaymentDetailsProps {
  orderId: string;
  payment?: Payment;
  orderStatus: OrderStatus;
}

export function OrderPaymentDetails({ 
  orderId, 
  payment, 
  orderStatus 
}: OrderPaymentDetailsProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CREDIT_CARD
  );
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePayment = async () => {
    if (!validatePaymentDetails()) return;

    try {
      setProcessing(true);
      const response = await fetch(`/api/orders/${orderId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: paymentMethod,
          paymentDetails: {
            cardNumber: cardNumber.replace(/\s/g, ''),
            expiryMonth,
            expiryYear,
            cvv
          }
        })
      });

      if (!response.ok) throw new Error('Payment failed');
      
      // Refresh the page to show updated payment status
      window.location.reload();
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const validatePaymentDetails = () => {
    if (paymentMethod === PaymentMethod.CREDIT_CARD) {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
        alert('Please enter a valid card number');
        return false;
      }
      if (!expiryMonth || !expiryYear) {
        alert('Please enter a valid expiry date');
        return false;
      }
      if (!cvv || cvv.length !== 3) {
        alert('Please enter a valid CVV');
        return false;
      }
    }
    return true;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    const colors = {
      [PaymentStatus.PENDING]: 'bg-yellow-500',
      [PaymentStatus.AUTHORIZED]: 'bg-blue-500',
      [PaymentStatus.CAPTURED]: 'bg-green-500',
      [PaymentStatus.FAILED]: 'bg-red-500',
      [PaymentStatus.REFUNDED]: 'bg-orange-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (payment) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Payment Status</span>
              <Badge className={getPaymentStatusColor(payment.status)}>
                {payment.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Payment Method</span>
              <span>{payment.method}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Amount</span>
              <span>{formatCurrency(payment.amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orderStatus !== OrderStatus.PENDING) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">
            Payment is not available for orders in {orderStatus} status
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Payment Information</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Method</label>
          <Select
            value={paymentMethod}
            onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PaymentMethod.CREDIT_CARD}>
                Credit Card
              </SelectItem>
              <SelectItem value={PaymentMethod.BANK_TRANSFER}>
                Bank Transfer
              </SelectItem>
              <SelectItem value={PaymentMethod.WIRE_TRANSFER}>
                Wire Transfer
              </SelectItem>
              <SelectItem value={PaymentMethod.PURCHASE_ORDER}>
                Purchase Order
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentMethod === PaymentMethod.CREDIT_CARD && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Card Number</label>
              <Input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="**** **** **** ****"
                maxLength={19}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Month</label>
                <Input
                  type="text"
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value)}
                  placeholder="MM"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Input
                  type="text"
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value)}
                  placeholder="YY"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CVV</label>
                <Input
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="***"
                  maxLength={3}
                />
              </div>
            </div>
          </div>
        )}

        {paymentMethod === PaymentMethod.BANK_TRANSFER && (
          <div className="space-y-2 p-4 bg-gray-50 rounded-md">
            <p className="font-medium">Bank Transfer Instructions</p>
            <p className="text-sm text-gray-600">
              Please transfer the payment to the following account:
            </p>
            <div className="text-sm">
              <p>Bank: Example Bank</p>
              <p>Account Name: Bulk Buyer Group</p>
              <p>Account Number: XXXX-XXXX-XXXX</p>
              <p>Reference: {orderId}</p>
            </div>
          </div>
        )}

        <Button
          className="w-full"
          onClick={handlePayment}
          disabled={processing}
        >
          {processing ? 'Processing...' : 'Process Payment'}
        </Button>
      </CardContent>
    </Card>
  );
} 