'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { theme } from '@/lib/theme';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PoolMetricsData {
  totalPools: number;
  activePools: number;
  completedPools: number;
  averageCompletionTime: number;
  completionRates: Array<{
    category: string;
    rate: number;
  }>;
}

export function PoolMetrics() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<PoolMetricsData | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPoolMetrics() {
      try {
        const response = await fetch(`/api/analytics/pools?timeframe=${timeframe}`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching pool metrics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchPoolMetrics();
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
        <h2 className="text-xl font-semibold">Pool Completion Rates</h2>
        <select
          className="border rounded-md p-1 text-sm"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'year')}
          style={{ borderColor: theme.colors.orangeDarker }}
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
              <p className="text-sm text-gray-500">Active Pools</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.orangeDarker }}>
                {metrics.activePools}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Completed Pools</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.orangeLighter }}>
                {metrics.completedPools}
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Average Completion Time</p>
            <p className="text-xl font-semibold">
              {metrics.averageCompletionTime} days
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.completionRates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                  contentStyle={{ backgroundColor: 'white', border: `1px solid ${theme.colors.greyLighter}` }}
                />
                <Bar
                  dataKey="rate"
                  fill={theme.colors.orangeDarker}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
} 