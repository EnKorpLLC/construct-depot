'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { OrderStatusTimeline } from './OrderStatusTimeline';
import { OrderPaymentDetails } from './OrderPaymentDetails';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    name: string;
    description: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payment?: {
    status: PaymentStatus;
    method: string;
    amount: number;
  };
  poolExpiry?: string;
  notes?: string;
}

interface OrderDetailsProps {
  orderId: string;
}

export function OrderDetails({ orderId }: OrderDetailsProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order details');
      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update order status');
      await fetchOrderDetails();
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to cancel order');
      router.push('/orders');
    } catch (error) {
      console.error('Error cancelling order:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-gray-500">Created on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          {order.status === OrderStatus.DRAFT && (
            <Button onClick={() => handleStatusUpdate(OrderStatus.PENDING)}>
              Submit Order
            </Button>
          )}
          {order.status !== OrderStatus.CANCELLED && (
            <Button variant="destructive" onClick={handleCancelOrder}>
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Order Status</h2>
          </CardHeader>
          <CardContent>
            <Badge className="mb-4" variant="outline">
              {order.status}
            </Badge>
            <OrderStatusTimeline status={order.status} />
          </CardContent>
        </Card>

        {order.status === OrderStatus.POOLING && order.poolExpiry && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Pool Information</h2>
            </CardHeader>
            <CardContent>
              <p>Pool expires on: {formatDate(order.poolExpiry)}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Order Summary</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Order Items</TabsTrigger>
          <TabsTrigger value="payment">Payment Details</TabsTrigger>
          {order.notes && <TabsTrigger value="notes">Notes</TabsTrigger>}
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardContent className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">Product</th>
                    <th className="text-right pb-2">Quantity</th>
                    <th className="text-right pb-2">Unit Price</th>
                    <th className="text-right pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.product.description}
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-2">{item.quantity}</td>
                      <td className="text-right py-2">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="text-right py-2">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <OrderPaymentDetails 
            orderId={orderId} 
            payment={order.payment}
            orderStatus={order.status}
          />
        </TabsContent>

        {order.notes && (
          <TabsContent value="notes">
            <Card>
              <CardContent className="p-6">
                <p className="whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 