'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
import { OrderStatus } from '@prisma/client';
import { Progress } from '@/components/ui/progress';

interface OrderListProps {
  type?: 'regular' | 'pooled';
}

interface Order {
  id: string;
  status: OrderStatus;
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
  subtotal: number;
  taxAmount: number;
  poolProgress?: {
    currentQuantity: number;
    targetQuantity: number;
    progress: number;
  };
}

const STATUS_COLORS = {
  POOLING: 'secondary',
  PENDING: 'default',
  PROCESSING: 'warning',
  CONFIRMED: 'info',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
} as const;

export function OrderList({ type = 'regular' }: OrderListProps) {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [type]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/supplier/orders?type=${type}&limit=10&offset=0`
      );
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdating(orderId);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update order status');
      }
      
      // Refresh orders after status update
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const getAvailableStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    const allStatuses: OrderStatus[] = ['POOLING', 'PENDING', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const statusIndex = allStatuses.indexOf(currentStatus);
    
    // If cancelled or delivered, no more status changes allowed
    if (currentStatus === 'CANCELLED' || currentStatus === 'DELIVERED') {
      return [];
    }
    
    // Can always cancel unless delivered
    const nextStatuses = allStatuses.slice(statusIndex + 1, statusIndex + 2);
    if (currentStatus !== 'DELIVERED') {
      nextStatuses.push('CANCELLED');
    }
    
    return nextStatuses;
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!orders.length) return <div>No orders found.</div>;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>
                <div>{order.user.name}</div>
                <div className="text-sm text-gray-500">{order.user.email}</div>
              </TableCell>
              <TableCell>
                {order.items.map((item, index) => (
                  <div key={index}>
                    {item.quantity}x {item.product.name}
                    {order.status === 'POOLING' && (
                      <div className="text-sm text-gray-500">
                        Min. Quantity: {item.product.minOrderQuantity}
                      </div>
                    )}
                  </div>
                ))}
              </TableCell>
              <TableCell>
                {formatCurrency(order.subtotal + order.taxAmount)}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_COLORS[order.status]}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>
                {order.status === 'POOLING' && order.poolProgress && (
                  <div className="space-y-2">
                    <Progress value={order.poolProgress.progress} />
                    <div className="text-sm text-gray-500">
                      {order.poolProgress.currentQuantity} / {order.poolProgress.targetQuantity}
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {updating === order.id ? (
                  <div>Updating...</div>
                ) : (
                  <Select
                    onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                    disabled={!getAvailableStatuses(order.status).length}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableStatuses(order.status).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 