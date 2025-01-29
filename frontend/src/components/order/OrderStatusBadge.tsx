import React from 'react';
import { OrderStatus } from '../../types/order';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'bg-gray-500',
  [OrderStatus.POOLING]: 'bg-blue-500',
  [OrderStatus.PENDING]: 'bg-yellow-500',
  [OrderStatus.CONFIRMED]: 'bg-green-500',
  [OrderStatus.PROCESSING]: 'bg-purple-500',
  [OrderStatus.COMPLETED]: 'bg-green-700',
  [OrderStatus.CANCELLED]: 'bg-red-500'
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  return (
    <span className={`px-2 py-1 rounded-full text-white text-sm font-medium ${statusColors[status]}`}>
      {status}
    </span>
  );
}; 