'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OrderService } from '@/lib/services/order/OrderService';
import { Order, OrderStatus } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const orderService = OrderService.getInstance();
        const result = await orderService.listOrders({
          limit: 5,
          page: 1
        });
        setOrders(result.orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      [OrderStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.POOLING]: 'bg-blue-100 text-blue-800',
      [OrderStatus.CONFIRMED]: 'bg-green-100 text-green-800',
      [OrderStatus.PROCESSING]: 'bg-purple-100 text-purple-800',
      [OrderStatus.SHIPPED]: 'bg-indigo-100 text-indigo-800',
      [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
      [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [OrderStatus.REFUNDED]: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-3">
            <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/customer/orders/${order.id}`}
          className="block bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  Order #{order.orderNumber}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div>
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${getStatusColor(order.status)}
                `}>
                  {order.status}
                </span>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Total: ${order.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </Link>
      ))}

      <Link
        href="/customer/orders"
        className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-4"
      >
        View All Orders →
      </Link>
    </div>
  );
} 