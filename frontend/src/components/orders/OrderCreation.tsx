'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/utils/formatters';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  minOrderQuantity: number;
  unit: string;
}

interface OrderCreationState {
  productId: string;
  quantity: number;
  notes: string;
  poolExpiry?: string;
}

export function OrderCreation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPool = searchParams.get('type') === 'pool';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [formState, setFormState] = useState<OrderCreationState>({
    productId: '',
    quantity: 0,
    notes: '',
    poolExpiry: isPool ? getDefaultExpiry() : undefined
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  function getDefaultExpiry() {
    const date = new Date();
    date.setHours(date.getHours() + 48); // Default 48 hour expiry
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  }

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    setFormState(prev => ({
      ...prev,
      productId,
      quantity: product?.minOrderQuantity || 0
    }));
  };

  const handleSubmit = async () => {
    if (!selectedProduct) return;

    try {
      setSubmitting(true);
      const endpoint = isPool ? '/api/orders/pool/create' : '/api/orders';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formState.productId,
          quantity: formState.quantity,
          notes: formState.notes,
          ...(isPool && { poolExpiry: formState.poolExpiry })
        })
      });

      if (!response.ok) throw new Error('Failed to create order');
      
      const data = await response.json();
      router.push(`/orders/${data.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    return selectedProduct.price * formState.quantity;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {isPool ? 'Create Pool Order' : 'Create Order'}
        </h1>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Product</label>
            <Select
              value={formState.productId}
              onValueChange={handleProductSelect}
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {formatCurrency(product.price)} per {product.unit}
                </option>
              ))}
            </Select>
          </div>

          {selectedProduct && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity ({selectedProduct.unit})</label>
                <Input
                  type="number"
                  min={selectedProduct.minOrderQuantity}
                  value={formState.quantity}
                  onChange={(e) => setFormState(prev => ({
                    ...prev,
                    quantity: Number(e.target.value)
                  }))}
                />
                <p className="text-sm text-gray-500">
                  Minimum order quantity: {selectedProduct.minOrderQuantity} {selectedProduct.unit}
                </p>
              </div>

              {isPool && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pool Expiry</label>
                  <Input
                    type="datetime-local"
                    value={formState.poolExpiry}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setFormState(prev => ({
                      ...prev,
                      poolExpiry: e.target.value
                    }))}
                  />
                  <p className="text-sm text-gray-500">
                    Set when this pool will expire and orders will be processed
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={formState.notes}
                  onChange={(e) => setFormState(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Add any special instructions or notes..."
                />
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Unit Price</span>
                    <span>{formatCurrency(selectedProduct.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantity</span>
                    <span>{formState.quantity} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={submitting || formState.quantity < selectedProduct.minOrderQuantity}
                >
                  {submitting ? 'Creating...' : isPool ? 'Create Pool' : 'Create Order'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 