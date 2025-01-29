'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { theme } from '@/lib/theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesData {
  labels: string[];
  revenue: number[];
  orders: number[];
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    revenue: number;
    quantity: number;
  }>;
}

export function SalesAnalytics() {
  const { data: session } = useSession();
  const [salesData, setSalesData] = useState<SalesData>({
    labels: [],
    revenue: [],
    orders: [],
    averageOrderValue: 0,
    topProducts: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    async function fetchSalesData() {
      try {
        const response = await fetch(`/api/supplier/analytics/sales?timeframe=${timeframe}`);
        if (response.ok) {
          const data = await response.json();
          setSalesData(data);
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchSalesData();
    }
  }, [session, timeframe]);

  const chartData = {
    labels: salesData.labels,
    datasets: [
      {
        label: 'Revenue',
        data: salesData.revenue,
        borderColor: theme.colors.blueDarker,
        backgroundColor: `${theme.colors.blueDarker}20`,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Revenue: $${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => `$${value.toLocaleString()}`
        }
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Sales Analytics</h2>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'year')}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <h4 className="text-sm text-gray-500 mb-1">Total Revenue</h4>
              <p className="text-2xl font-bold" style={{ color: theme.colors.blueDarker }}>
                ${salesData.revenue.reduce((a, b) => a + b, 0).toLocaleString()}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="text-sm text-gray-500 mb-1">Total Orders</h4>
              <p className="text-2xl font-bold" style={{ color: theme.colors.orangeDarker }}>
                {salesData.orders.reduce((a, b) => a + b, 0)}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="text-sm text-gray-500 mb-1">Avg. Order Value</h4>
              <p className="text-2xl font-bold" style={{ color: theme.colors.blueLighter }}>
                ${salesData.averageOrderValue.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="h-64">
              <Line data={chartData} options={options} />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Top Selling Products</h3>
            <div className="space-y-3">
              {salesData.topProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      {product.quantity} units sold
                    </p>
                  </div>
                  <p className="font-medium" style={{ color: theme.colors.blueDarker }}>
                    ${product.revenue.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 