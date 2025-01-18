'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  activeUsers: number;
  requestsPerMinute: number;
  errorRate: number;
  uptime: number;
}

export function SystemMetricsWidget() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (error) {
      setError('Failed to load system metrics');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (value: number, threshold: number) => {
    return value > threshold ? 'text-red-600' : 'text-green-600';
  };

  if (loading && !metrics) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">System Metrics</h2>
        <Button onClick={fetchMetrics} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4">
            <div className="text-sm font-medium text-gray-500">CPU Usage</div>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.cpu, 80)}`}>
              {metrics.cpu.toFixed(1)}%
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-gray-500">Memory Usage</div>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.memory, 90)}`}>
              {metrics.memory.toFixed(1)}%
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-gray-500">Storage Usage</div>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.storage, 85)}`}>
              {metrics.storage.toFixed(1)}%
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-gray-500">Active Users</div>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.activeUsers}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-gray-500">Requests/min</div>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.requestsPerMinute, 1000)}`}>
              {metrics.requestsPerMinute}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-gray-500">Error Rate</div>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.errorRate, 5)}`}>
              {metrics.errorRate.toFixed(2)}%
            </div>
          </Card>

          <Card className="p-4 md:col-span-2 lg:col-span-3">
            <div className="text-sm font-medium text-gray-500">System Uptime</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatUptime(metrics.uptime)}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 