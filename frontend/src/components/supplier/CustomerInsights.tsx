'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { theme } from '@/lib/theme';

interface CustomerInsight {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  averageCustomerValue: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    orderCount: number;
    lastOrder: string;
    status: 'active' | 'inactive';
  }>;
  customerSegments: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
}

export function CustomerInsights() {
  const { data: session } = useSession();
  const [insights, setInsights] = useState<CustomerInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'customers'>('overview');

  useEffect(() => {
    async function fetchCustomerInsights() {
      try {
        const response = await fetch('/api/supplier/analytics/customers');
        if (response.ok) {
          const data = await response.json();
          setInsights(data);
        }
      } catch (error) {
        console.error('Error fetching customer insights:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchCustomerInsights();
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center text-gray-500 py-8">
        Unable to load customer insights.
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Customer Insights</h2>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              view === 'overview'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setView('overview')}
          >
            Overview
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              view === 'customers'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setView('customers')}
          >
            Top Customers
          </button>
        </div>
      </div>

      {view === 'overview' ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <h4 className="text-sm text-gray-500 mb-1">Total Customers</h4>
              <p className="text-2xl font-bold" style={{ color: theme.colors.blueDarker }}>
                {insights.totalCustomers}
              </p>
              <p className="text-sm text-green-600 mt-1">
                +{insights.newCustomers} new this month
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="text-sm text-gray-500 mb-1">Repeat Customers</h4>
              <p className="text-2xl font-bold" style={{ color: theme.colors.orangeDarker }}>
                {insights.repeatCustomers}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {((insights.repeatCustomers / insights.totalCustomers) * 100).toFixed(1)}% retention
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-3">Customer Segments</h3>
            <div className="space-y-3">
              {insights.customerSegments.map((segment, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">{segment.name}</p>
                    <p className="text-sm text-gray-500">
                      {segment.count} customers ({segment.percentage}%)
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${segment.percentage}%`,
                        backgroundColor: theme.colors.blueDarker
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {insights.topCustomers.map((customer) => (
            <div
              key={customer.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-gray-500">
                    {customer.orderCount} orders
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    customer.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {customer.status}
                </span>
              </div>
              <div className="mt-2 flex justify-between items-center text-sm">
                <p className="text-gray-500">
                  Last order: {new Date(customer.lastOrder).toLocaleDateString()}
                </p>
                <p className="font-medium" style={{ color: theme.colors.blueDarker }}>
                  ${customer.totalSpent.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 