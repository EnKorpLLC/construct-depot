'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { OrderStatus } from '@prisma/client';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderStatusTimeline } from './OrderStatusTimeline';

interface OrderMetrics {
  totalOrders: number;
  totalValue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  poolingOrders: number;
  poolSuccessRate: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    productId: string;
    quantity: number;
    product: {
      name: string;
    };
  }>;
}

export function OrderDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<OrderMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsResponse, ordersResponse] = await Promise.all([
        fetch('/api/orders/metrics'),
        fetch('/api/orders/recent')
      ]);

      const [metricsData, ordersData] = await Promise.all([
        metricsResponse.json(),
        ordersResponse.json()
      ]);

      setMetrics(metricsData);
      setRecentOrders(ordersData.orders);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      DRAFT: 'bg-gray-500',
      POOLING: 'bg-blue-500',
      PENDING: 'bg-yellow-500',
      CONFIRMED: 'bg-green-500',
      PROCESSING: 'bg-purple-500',
      SHIPPED: 'bg-indigo-500',
      DELIVERED: 'bg-emerald-500',
      CANCELLED: 'bg-red-500',
      REFUNDED: 'bg-orange-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!metrics) {
    return <div className="text-center py-8">Failed to load dashboard data</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Order Dashboard</h1>
        <Button onClick={() => router.push('/orders/new')}>
          Create Order
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent Orders</TabsTrigger>
          <TabsTrigger value="pools">Active Pools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                <p className="text-2xl font-bold mt-2">{metrics.totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(metrics.totalValue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(metrics.averageOrderValue)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Orders by Status</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(metrics.ordersByStatus).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{status}</span>
                    <span>{count}</span>
                  </div>
                  <Progress
                    value={(count / metrics.totalOrders) * 100}
                    className={getStatusColor(status as OrderStatus)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Pool Statistics</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Active Pools</h3>
                  <p className="text-xl font-bold mt-1">{metrics.poolingOrders}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Pool Success Rate</h3>
                  <p className="text-xl font-bold mt-1">
                    {(metrics.poolSuccessRate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">
                        {order.items[0].product.name}
                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <p className="text-sm mt-1">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pools">
          <Card>
            <CardContent className="p-6">
              {recentOrders
                .filter(order => order.status === 'POOLING')
                .map((pool) => (
                  <div
                    key={pool.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer mb-4"
                    onClick={() => router.push(`/orders/${pool.id}`)}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{pool.orderNumber}</p>
                      <p className="text-sm text-gray-500">
                        {pool.items[0].product.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Created {formatDate(pool.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(pool.totalAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {pool.items[0].quantity} units
                      </p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 