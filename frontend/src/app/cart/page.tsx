'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { taxService } from '@/lib/tax';
import type { TaxAddress } from '@/lib/tax';
import { TaxCalculation } from '@/components/cart/TaxCalculation';
import { TaxExemptionInput } from '@/components/checkout/TaxExemptionInput';

interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    minOrderQuantity: number;
    unit: string;
    images: string[];
    supplier: {
      name: string;
      company: string | null;
    };
  };
  quantity: number;
}

interface CartSummary {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
}

export default function CartPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [processing, setProcessing] = useState(false);
  const [summary, setSummary] = useState<CartSummary>({
    subtotal: 0,
    taxAmount: 0,
    taxRate: 0,
    total: 0,
  });
  const [shippingAddress, setShippingAddress] = useState<TaxAddress>({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });
  const [billingAddress, setBillingAddress] = useState<TaxAddress>({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [calculatingTax, setCalculatingTax] = useState(false);
  const [isExempt, setIsExempt] = useState(false);
  const [exemptionNumber, setExemptionNumber] = useState<string | null>(null);

  useEffect(() => {
    fetchCartItems();
  }, []);

  useEffect(() => {
    if (cartItems.length > 0 && shippingAddress.zip) {
      calculateTax();
    }
  }, [cartItems, shippingAddress]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cart');
      if (!response.ok) throw new Error('Failed to fetch cart items');
      
      const data = await response.json();
      setCartItems(data.items);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) throw new Error('Failed to update quantity');
      
      // Refresh cart items
      fetchCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove item');
      
      // Refresh cart items
      fetchCartItems();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const calculateTax = async () => {
    try {
      setCalculatingTax(true);
      const subtotal = cartItems.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
      }, 0);

      // Get tax calculation from the first item's supplier
      // In a real app, you might need to handle multiple suppliers
      const supplierAddress = {
        street: cartItems[0].product.supplier.address?.street || '',
        city: cartItems[0].product.supplier.address?.city || '',
        state: cartItems[0].product.supplier.address?.state || '',
        zip: cartItems[0].product.supplier.address?.zip || '',
        country: cartItems[0].product.supplier.address?.country || 'US',
      };

      const taxResult = await taxService.calculateOrderTax({
        toAddress: shippingAddress,
        fromAddress: supplierAddress,
        amount: subtotal,
        lineItems: cartItems.map(item => ({
          id: item.product.id,
          quantity: item.quantity,
          product_tax_code: item.product.taxCode,
          unit_price: item.product.price,
        })),
      });

      setSummary({
        subtotal,
        taxAmount: taxResult.taxAmount,
        taxRate: taxResult.rate,
        total: subtotal + taxResult.taxAmount,
      });
    } catch (error) {
      console.error('Error calculating tax:', error);
    } finally {
      setCalculatingTax(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod,
          shippingAddress,
          billingAddress: sameAsShipping ? shippingAddress : billingAddress,
        }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');
      
      const data = await response.json();
      
      if (paymentMethod === 'stripe') {
        window.location.href = data.url;
      } else {
        window.location.href = data.paypalUrl;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Button onClick={() => router.push('/catalog')}>
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 relative">
                      {item.product.images && item.product.images[0] && (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="object-cover w-full h-full rounded"
                        />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">
                        Supplier: {item.product.supplier.company || item.product.supplier.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        MOQ: {item.product.minOrderQuantity} {item.product.unit}
                      </p>
                      <div className="mt-2 flex items-center gap-4">
                        <Input
                          type="number"
                          min={item.product.minOrderQuantity}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                          className="w-24"
                        />
                        <span>{item.product.unit}</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-semibold">${item.product.price * item.quantity}</p>
                      <p className="text-sm text-gray-600">
                        ${item.product.price} per {item.product.unit}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={shippingAddress.street}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({
                        ...prev,
                        street: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          state: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={shippingAddress.zip}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          zip: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={shippingAddress.country}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <TaxCalculation
                    subtotal={summary.subtotal}
                    shippingState={shippingAddress.state}
                    isExempt={isExempt}
                    exemptionNumber={exemptionNumber}
                    onTaxCalculated={(result) => {
                      setSummary({
                        ...summary,
                        taxAmount: result.taxAmount,
                        taxRate: result.taxRate,
                        total: result.total,
                      });
                    }}
                  />

                  <TaxExemptionInput
                    onExemptionChange={(newIsExempt, newExemptionNumber) => {
                      setIsExempt(newIsExempt);
                      setExemptionNumber(newExemptionNumber);
                    }}
                  />

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(value: 'stripe' | 'paypal') =>
                        setPaymentMethod(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Credit Card (Stripe)</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleCheckout}
                  disabled={
                    processing ||
                    cartItems.length === 0 ||
                    !shippingAddress.zip ||
                    calculatingTax ||
                    (isExempt && !exemptionNumber)
                  }
                  className="w-full"
                >
                  {processing
                    ? 'Processing...'
                    : `Proceed to Checkout ($${summary.total.toFixed(2)})`}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 