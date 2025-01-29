import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '../../types/order';
import { OrderService } from '../../services/order/OrderService';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderActions } from './OrderActions';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  
  const orderService = OrderService.getInstance();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const fetchedOrders = await orderService.listOrders(undefined, statusFilter);
        setOrders(fetchedOrders);
        setError(null);
      } catch (err) {
        setError('Failed to load orders');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();

    // Subscribe to real-time updates
    const cleanup = orderService.onOrderUpdate((updatedOrder) => {
      setOrders(current => 
        current.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
    });

    return cleanup;
  }, [statusFilter]);

  if (loading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="order-list">
      <div className="filters">
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus)}
        >
          <option value="">All Statuses</option>
          {Object.values(OrderStatus).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <table className="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Status</th>
            <th>Items</th>
            <th>Total Amount</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td><OrderStatusBadge status={order.status} /></td>
              <td>{order.items.length} items</td>
              <td>{formatCurrency(order.totalAmount)}</td>
              <td>{formatDate(order.createdAt)}</td>
              <td>
                <OrderActions 
                  order={order}
                  onUpdate={(updatedOrder) => {
                    setOrders(current =>
                      current.map(o => o.id === updatedOrder.id ? updatedOrder : o)
                    );
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 