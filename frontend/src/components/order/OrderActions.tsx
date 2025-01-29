import React from 'react';
import { Order, OrderStatus } from '../../types/order';
import { OrderService } from '../../services/order/OrderService';

interface OrderActionsProps {
  order: Order;
  onUpdate: (order: Order) => void;
}

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.POOLING, OrderStatus.CANCELLED],
  [OrderStatus.POOLING]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: []
};

export const OrderActions: React.FC<OrderActionsProps> = ({ order, onUpdate }) => {
  const orderService = OrderService.getInstance();
  const availableTransitions = validTransitions[order.status];

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      const updatedOrder = await orderService.updateOrder(order.id, { status: newStatus });
      onUpdate(updatedOrder);
    } catch (error) {
      console.error('Failed to update order status:', error);
      // You might want to show a toast notification here
    }
  };

  if (availableTransitions.length === 0) {
    return (
      <span className="text-gray-500 italic">
        No actions available
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      {availableTransitions.map(status => (
        <button
          key={status}
          onClick={() => handleStatusChange(status)}
          className={`px-3 py-1 rounded text-white text-sm font-medium
            ${status === OrderStatus.CANCELLED ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}
          `}
        >
          {status === OrderStatus.CANCELLED ? 'Cancel' : `Mark as ${status}`}
        </button>
      ))}
    </div>
  );
}; 