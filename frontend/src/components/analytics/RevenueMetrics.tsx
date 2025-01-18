'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { theme } from '@/lib/theme';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueMetricsData {
  totalRevenue: number;
  averageOrderValue: number;
  revenueGrowth: number;
  revenueTrends: Array<{
    date: string;
    revenue: number;
    averageOrder: number;
  }>;
}

export function RevenueMetrics() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<RevenueMetricsData | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRevenueMetrics() {
      try {
        const response = await fetch(`/api/analytics/revenue?timeframe=${timeframe}`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching revenue metrics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchRevenueMetrics();
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
        <h2 className="text-xl font-semibold">Revenue Analytics</h2>
        <select
          className="border rounded-md p-1 text-sm"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'year')}
          style={{ borderColor: theme.colors.blueLighter }}
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
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.blueLighter }}>
                ${metrics.totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm" style={{ color: metrics.revenueGrowth >= 0 ? 'green' : 'red' }}>
                {metrics.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(metrics.revenueGrowth)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Average Order Value</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.blueDarker }}>
                ${metrics.averageOrderValue.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: 'white', border: `1px solid ${theme.colors.greyLighter}` }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={theme.colors.blueLighter}
                  fill={theme.colors.blueLighter}
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="averageOrder"
                  stroke={theme.colors.blueDarker}
                  fill={theme.colors.blueDarker}
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
} 