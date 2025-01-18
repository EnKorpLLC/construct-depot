'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CrawlerConfig } from '@/types/crawler';
import JobMonitoringDashboard from '@/components/crawler/JobMonitoringDashboard';

export default function CrawlerManagement() {
  const [configs, setConfigs] = useState<CrawlerConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const response = await fetch('/api/crawler/config');
        if (!response.ok) throw new Error('Failed to fetch configurations');
        const data = await response.json();
        setConfigs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  const handleStartCrawl = async (configId: string) => {
    try {
      const response = await fetch('/api/crawler/job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start crawler');
      }

      setSelectedConfig(configId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start crawler');
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/crawler/config/${configId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }

      setConfigs(configs.filter(config => config.id !== configId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete configuration');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="px-4 py-5 sm:px-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Crawler Management</h1>
          <Link
            href="/admin/crawler/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Configuration
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {configs.map(config => (
              <li key={config.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {config.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {config.description}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Target URL: {config.targetUrl}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className="mr-4">Rate Limit: {config.rateLimit} req/min</span>
                        {config.schedule && (
                          <span>Schedule: {config.schedule}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleStartCrawl(config.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Start Crawl
                      </button>
                      <Link
                        href={`/admin/crawler/${config.id}/edit`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteConfig(config.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Job Monitoring</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <JobMonitoringDashboard configId={selectedConfig || undefined} />
          </div>
        </div>
      </div>
    </div>
  );
} 