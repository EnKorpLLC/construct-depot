'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

type PooledOrder = {
  id: string;
  status: string;
  createdAt: string;
  orders: Array<{
    id: string;
    status: string;
    user: {
      name: string;
      email: string;
    };
    items: Array<{
      quantity: number;
      priceAtTime: number;
      product: {
        name: string;
        minOrderQuantity: number;
      };
    }>;
  }>;
};

export function PooledOrderList() {
  const [pooledOrders, setPooledOrders] = useState<PooledOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPooledOrders();
  }, []);

  const fetchPooledOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/supplier/orders?type=pooled');
      if (!response.ok) throw new Error('Failed to fetch pooled orders');
      const data = await response.json();
      setPooledOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updatePooledOrderStatus = async (pooledOrderId: string, status: string) => {
    try {
      const response = await fetch('/api/supplier/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pooledOrderId, status }),
      });

      if (!response.ok) throw new Error('Failed to update pooled order status');
      
      // Refresh orders after status update
      await fetchPooledOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (loading) return <div>Loading pooled orders...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!pooledOrders.length) return <div>No pooled orders found.</div>;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pooled Order ID</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Total Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pooledOrders.map((pooledOrder) => {
            // Calculate total quantities per product
            const totalsByProduct = pooledOrder.orders.reduce((acc, order) => {
              order.items.forEach((item) => {
                const key = item.product.name;
                if (!acc[key]) {
                  acc[key] = {
                    quantity: 0,
                    minOrderQuantity: item.product.minOrderQuantity,
                  };
                }
                acc[key].quantity += item.quantity;
              });
              return acc;
            }, {} as Record<string, { quantity: number; minOrderQuantity: number }>);

            return (
              <TableRow key={pooledOrder.id}>
                <TableCell className="font-medium">{pooledOrder.id}</TableCell>
                <TableCell>
                  {pooledOrder.orders.map((order) => (
                    <div key={order.id} className="mb-2">
                      <div className="font-medium">Order {order.id}</div>
                      <div className="text-sm text-gray-500">
                        {order.user.name} ({order.user.email})
                      </div>
                      {order.items.map((item, index) => (
                        <div key={index} className="text-sm">
                          {item.quantity}x {item.product.name}
                        </div>
                      ))}
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  {Object.entries(totalsByProduct).map(([product, data]) => (
                    <div key={product} className="mb-1">
                      <span className="font-medium">{product}:</span>{' '}
                      {data.quantity} / {data.minOrderQuantity} minimum
                      <Badge
                        variant={
                          data.quantity >= data.minOrderQuantity
                            ? 'success'
                            : 'default'
                        }
                        className="ml-2"
                      >
                        {data.quantity >= data.minOrderQuantity
                          ? 'Met'
                          : `${data.minOrderQuantity - data.quantity} more needed`}
                      </Badge>
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      pooledOrder.status === 'COMPLETED'
                        ? 'success'
                        : pooledOrder.status === 'CANCELLED'
                        ? 'destructive'
                        : 'default'
                    }
                  >
                    {pooledOrder.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={pooledOrder.status}
                    onValueChange={(value) =>
                      updatePooledOrderStatus(pooledOrder.id, value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="COMPLETED">Complete</SelectItem>
                      <SelectItem value="CANCELLED">Cancel</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 