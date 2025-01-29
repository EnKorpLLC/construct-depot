'use client';

import { useEffect, useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { AdminService } from '@/services/admin';

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeUsers: number;
  responseTime: number;
  uptime: number;
  errorRate: number;
}

interface MetricTrend {
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export default function SystemHealthWidget() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call when endpoint is ready
        const response = await fetch('/api/admin/system/health');
        const data = await response.json();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch system metrics');
        console.error('Error fetching system metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-8 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-500 flex items-center justify-center">
          <span className="mr-2">⚠️</span>
          {error}
        </div>
      </div>
    );
  }

  const renderMetric = (label: string, value: number, unit: string, trend?: MetricTrend) => (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
      <div className="flex items-center">
        <span className="text-2xl font-bold text-gray-900">
          {value}
          <span className="text-sm font-normal ml-1">{unit}</span>
        </span>
        {trend && (
          <div className={`ml-2 flex items-center ${
            trend.trend === 'up' ? 'text-red-500' : 
            trend.trend === 'down' ? 'text-green-500' : 
            'text-gray-500'
          }`}>
            {trend.trend === 'up' ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : trend.trend === 'down' ? (
              <ArrowDownIcon className="h-4 w-4" />
            ) : null}
            <span className="text-sm ml-1">{trend.change}%</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {metrics && (
          <>
            {renderMetric('CPU Usage', metrics.cpuUsage, '%', {
              value: metrics.cpuUsage,
              trend: metrics.cpuUsage > 80 ? 'up' : 'down',
              change: 5
            })}
            {renderMetric('Memory Usage', metrics.memoryUsage, '%', {
              value: metrics.memoryUsage,
              trend: metrics.memoryUsage > 80 ? 'up' : 'down',
              change: 3
            })}
            {renderMetric('Disk Usage', metrics.diskUsage, '%')}
            {renderMetric('Active Users', metrics.activeUsers, '')}
            {renderMetric('Response Time', metrics.responseTime, 'ms')}
            {renderMetric('Error Rate', metrics.errorRate, '%', {
              value: metrics.errorRate,
              trend: metrics.errorRate > 2 ? 'up' : 'down',
              change: 1
            })}
          </>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
        <button
          onClick={() => setLoading(true)}
          className="text-blue-500 hover:text-blue-600 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
} 