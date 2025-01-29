'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { theme } from '@/lib/theme';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface CustomerMetricsData {
  totalCustomers: number;
  newCustomers: number;
  repeatRate: number;
  averageOrdersPerCustomer: number;
  customerSegments: Array<{
    name: string;
    value: number;
  }>;
  topCategories: Array<{
    category: string;
    orders: number;
    revenue: number;
  }>;
}

export function CustomerMetrics() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<CustomerMetricsData | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);

  const COLORS = [
    theme.colors.blueDarker,
    theme.colors.orangeDarker,
    theme.colors.blueLighter,
    theme.colors.orangeLighter,
  ];

  useEffect(() => {
    async function fetchCustomerMetrics() {
      try {
        const response = await fetch(`/api/analytics/customers?timeframe=${timeframe}`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching customer metrics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchCustomerMetrics();
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
        <h2 className="text-xl font-semibold">Customer Behavior</h2>
        <select
          className="border rounded-md p-1 text-sm"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'year')}
          style={{ borderColor: theme.colors.orangeLighter }}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {metrics && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.orangeLighter }}>
                {metrics.totalCustomers}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">New Customers</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.orangeDarker }}>
                {metrics.newCustomers}
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Repeat Purchase Rate</p>
                <p className="text-xl font-semibold">{metrics.repeatRate}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Orders/Customer</p>
                <p className="text-xl font-semibold">{metrics.averageOrdersPerCustomer}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="h-48">
              <p className="text-sm font-medium mb-2">Customer Segments</p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.customerSegments}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={(entry) => entry.name}
                  >
                    {metrics.customerSegments.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Percentage']}
                    contentStyle={{ backgroundColor: 'white', border: `1px solid ${theme.colors.greyLighter}` }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Top Categories</p>
              <div className="space-y-2">
                {metrics.topCategories.map((category, index) => (
                  <div key={category.category} className="text-sm">
                    <div className="flex justify-between">
                      <span>{category.category}</span>
                      <span className="font-medium">${category.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${(category.orders / Math.max(...metrics.topCategories.map(c => c.orders))) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 