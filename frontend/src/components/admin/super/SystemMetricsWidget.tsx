import { useEffect, useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { useWebSocket } from '@/hooks/useWebSocket';

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeUsers: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: string;
  lastDeployment: string;
  servicesStatus: {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
  }[];
}

export default function SystemMetricsWidget() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch of metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/system/metrics');
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
  }, []);

  // WebSocket subscription for real-time updates
  useWebSocket('system_metrics', (data: SystemMetrics) => {
    setMetrics(data);
    setError(null);
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded" />
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

  if (!metrics) return null;

  const getStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Resource Usage */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">CPU Usage</div>
          <div className="text-2xl font-semibold text-gray-900">{metrics.cpuUsage}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.cpuUsage}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Memory Usage</div>
          <div className="text-2xl font-semibold text-gray-900">{metrics.memoryUsage}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.memoryUsage}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Disk Usage</div>
          <div className="text-2xl font-semibold text-gray-900">{metrics.diskUsage}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.diskUsage}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Active Users</div>
          <div className="text-2xl font-semibold text-gray-900">
            {formatNumber(metrics.activeUsers)}
          </div>
          <div className="text-sm text-green-500 flex items-center mt-2">
            <ArrowUpIcon className="h-4 w-4 mr-1" />
            12% from last hour
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Requests/min</div>
          <div className="text-2xl font-semibold text-gray-900">
            {formatNumber(metrics.requestsPerMinute)}
          </div>
          <div className="text-sm text-green-500 flex items-center mt-2">
            <ArrowUpIcon className="h-4 w-4 mr-1" />
            5% from average
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Avg Response Time</div>
          <div className="text-2xl font-semibold text-gray-900">
            {metrics.averageResponseTime}ms
          </div>
          <div className="text-sm text-red-500 flex items-center mt-2">
            <ArrowUpIcon className="h-4 w-4 mr-1" />
            8% from average
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Error Rate</div>
          <div className="text-2xl font-semibold text-gray-900">
            {metrics.errorRate}%
          </div>
          <div className="text-sm text-green-500 flex items-center mt-2">
            <ArrowDownIcon className="h-4 w-4 mr-1" />
            3% from average
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Uptime</div>
          <div className="text-2xl font-semibold text-gray-900">{metrics.uptime}</div>
          <div className="text-sm text-gray-500 mt-2">
            Last deployed: {metrics.lastDeployment}
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-3">Services Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.servicesStatus.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="font-medium text-gray-900">{service.name}</div>
                <div className={`text-sm ${getStatusColor(service.status)}`}>
                  {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {service.latency}ms
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 