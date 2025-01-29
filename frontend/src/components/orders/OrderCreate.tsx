'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatters';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  minOrderQuantity: number;
  supplierId: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  product: Product;
}

export function OrderCreate() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [orderType, setOrderType] = useState<'direct' | 'pool'>('direct');
  const [poolExpiryHours, setPoolExpiryHours] = useState<number>(24);
  const [items, setItems] = useState<OrderItem[]>([]);

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
    if (product) {
      setQuantity(product.minOrderQuantity);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;
    
    setItems([
      ...items,
      {
        productId: selectedProduct.id,
        quantity,
        unitPrice: selectedProduct.price,
        product: selectedProduct
      }
    ]);
    
    setSelectedProduct(null);
    setQuantity(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          orderType,
          ...(orderType === 'pool' && { poolExpiryHours })
        })
      });

      if (!response.ok) throw new Error('Failed to create order');
      
      const data = await response.json();
      router.push(`/orders/${data.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create New Order</h1>
        <Button variant="outline" onClick={() => router.push('/orders')}>
          Cancel
        </Button>
      </div>

      <div className="flex gap-4 mb-8">
        {[1, 2, 3].map((stepNumber) => (
          <div
            key={stepNumber}
            className={`flex-1 h-2 rounded ${
              step >= stepNumber ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Select Order Type</h2>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={orderType === 'direct' ? 'default' : 'outline'}
                onClick={() => setOrderType('direct')}
                className="h-24"
              >
                <div className="text-center">
                  <div className="font-medium">Direct Order</div>
                  <div className="text-sm text-gray-500">
                    Order directly from supplier
                  </div>
                </div>
              </Button>
              <Button
                variant={orderType === 'pool' ? 'default' : 'outline'}
                onClick={() => setOrderType('pool')}
                className="h-24"
              >
                <div className="text-center">
                  <div className="font-medium">Pool Order</div>
                  <div className="text-sm text-gray-500">
                    Join or create a pool order
                  </div>
                </div>
              </Button>
            </div>
            {orderType === 'pool' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Pool Duration (hours)</label>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={poolExpiryHours}
                  onChange={(e) => setPoolExpiryHours(Number(e.target.value))}
                />
              </div>
            )}
            <Button className="w-full" onClick={() => setStep(2)}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Add Products</h2>
            <div className="space-y-4">
              <Select onValueChange={handleProductSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedProduct && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    min={selectedProduct.minOrderQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                  <p className="text-sm text-gray-500">
                    Minimum order quantity: {selectedProduct.minOrderQuantity}
                  </p>
                  <Button onClick={handleAddItem}>Add to Order</Button>
                </div>
              )}

              {items.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Order Items</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2">Product</th>
                        <th className="text-right pb-2">Quantity</th>
                        <th className="text-right pb-2">Price</th>
                        <th className="text-right pb-2">Total</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{item.product.name}</td>
                          <td className="text-right">{item.quantity}</td>
                          <td className="text-right">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="text-right">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </td>
                          <td className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td colSpan={3} className="text-right py-2">
                          Total:
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(calculateTotal())}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={items.length === 0}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Review Order</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Order Type</h3>
                <p className="text-gray-600">
                  {orderType === 'direct' ? 'Direct Order' : 'Pool Order'}
                  {orderType === 'pool' && ` (${poolExpiryHours} hours)`}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Order Items</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2">Product</th>
                      <th className="text-right pb-2">Quantity</th>
                      <th className="text-right pb-2">Price</th>
                      <th className="text-right pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.product.name}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="text-right">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td colSpan={3} className="text-right py-2">
                        Total:
                      </td>
                      <td className="text-right py-2">
                        {formatCurrency(calculateTotal())}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={handleCreateOrder}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Order'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 