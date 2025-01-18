'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { theme } from '@/lib/theme';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OrderMetricsData {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  orderTrends: Array<{
    date: string;
    orders: number;
  }>;
}

export function OrderMetrics() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<OrderMetricsData | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrderMetrics() {
      try {
        const response = await fetch(`/api/analytics/orders?timeframe=${timeframe}`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching order metrics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchOrderMetrics();
    }
  }, [session, timeframe]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Order Volume</h2>
        <select
          className="border rounded-md p-1 text-sm"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'year')}
          style={{ borderColor: theme.colors.blueDarker }}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {metrics && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.blueDarker }}>
                {metrics.totalOrders}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.orangeDarker }}>
                {metrics.pendingOrders}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.blueLighter }}>
                {metrics.completedOrders}
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.orderTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  contentStyle={{ backgroundColor: 'white', border: `1px solid ${theme.colors.greyLighter}` }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke={theme.colors.blueDarker}
                  strokeWidth={2}
                  dot={{ fill: theme.colors.blueDarker }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
} 