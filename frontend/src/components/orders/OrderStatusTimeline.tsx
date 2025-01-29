'use client';

import { OrderStatus } from '@prisma/client';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface OrderStatusTimelineProps {
  status: OrderStatus;
}

const statusOrder = [
  OrderStatus.DRAFT,
  OrderStatus.POOLING,
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED
];

export function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  const currentIndex = statusOrder.indexOf(status);

  const getStatusIcon = (itemStatus: OrderStatus) => {
    const itemIndex = statusOrder.indexOf(itemStatus);
    
    if (status === OrderStatus.CANCELLED) {
      return <Circle className="w-6 h-6 text-gray-400" />;
    }
    
    if (itemIndex < currentIndex) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else if (itemIndex === currentIndex) {
      return <Clock className="w-6 h-6 text-blue-500 animate-pulse" />;
    } else {
      return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  if (status === OrderStatus.CANCELLED) {
    return (
      <div className="flex items-center justify-center p-4">
        <span className="text-red-500 font-medium">Order Cancelled</span>
      </div>
    );
  }

  if (status === OrderStatus.REFUNDED) {
    return (
      <div className="flex items-center justify-center p-4">
        <span className="text-orange-500 font-medium">Order Refunded</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {statusOrder.map((itemStatus, index) => (
        <div key={itemStatus} className="flex items-center gap-3">
          {getStatusIcon(itemStatus)}
          <div className="flex-1">
            <div className="flex justify-between">
              <span className={
                index <= currentIndex 
                  ? "font-medium" 
                  : "text-gray-500"
              }>
                {itemStatus}
              </span>
            </div>
            {index < statusOrder.length - 1 && (
              <div className="ml-3 mt-1 border-l-2 h-4 border-gray-200" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 