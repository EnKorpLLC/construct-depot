'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { theme } from '@/lib/theme';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: number;
  createdAt: string;
}

export function OrderManagement() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/supplier/orders');
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchOrders();
    }
  }, [session]);

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(order => order.status === selectedStatus);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Order Management</h2>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">Order #{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">{order.customerName}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="space-y-1">
                    <p>
                      <span className="text-gray-500">Total:</span>{' '}
                      <span className="font-medium">${order.total.toFixed(2)}</span>
                    </p>
                    <p>
                      <span className="text-gray-500">Items:</span>{' '}
                      <span className="font-medium">{order.items}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">
                      {formatDistanceToNow(new Date(order.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                    <button
                      className="text-blue-600 hover:text-blue-800 font-medium mt-1"
                      onClick={() => {/* Handle view details */}}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">
              No orders found for the selected status.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-1">Total Orders</h4>
          <p className="text-2xl font-bold" style={{ color: theme.colors.blueDarker }}>
            {orders.length}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-1">Pending</h4>
          <p className="text-2xl font-bold" style={{ color: theme.colors.orangeDarker }}>
            {orders.filter(order => order.status === 'pending').length}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-1">Processing</h4>
          <p className="text-2xl font-bold" style={{ color: theme.colors.blueLighter }}>
            {orders.filter(order => order.status === 'processing').length}
          </p>
        </div>
      </div>
    </div>
  );
} 