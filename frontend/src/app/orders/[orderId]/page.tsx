import { OrderHistory } from '@/components/orders/OrderHistory';
import { OrderDetails } from '@/components/orders/OrderDetails';

interface OrderPageProps {
  params: {
    orderId: string;
  };
}

export default function OrderPage({ params }: OrderPageProps) {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <OrderDetails orderId={params.orderId} />
      <OrderHistory orderId={params.orderId} />
    </div>
  );
} 