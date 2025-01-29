'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface CrawlerConfig {
  id: string;
  name: string;
  description: string;
  targetUrl: string;
  schedule: string;
  rateLimit: number;
  status: 'active' | 'paused' | 'error';
  lastRunAt?: string;
}

export function CrawlerManagementWidget() {
  const [configs, setConfigs] = useState<CrawlerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crawler/configs');
      if (!response.ok) throw new Error('Failed to fetch configurations');
      const data = await response.json();
      setConfigs(data);
      setError(null);
    } catch (error) {
      setError('Failed to load configurations');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleRunCrawler = async (configId: string) => {
    try {
      const response = await fetch('/api/crawler/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configId }),
      });

      if (!response.ok) throw new Error('Failed to start crawler');
      
      // Refresh the configurations list
      fetchConfigs();
    } catch (error) {
      setError('Failed to start crawler');
      console.error('Error:', error);
    }
  };

  const getStatusColor = (status: CrawlerConfig['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && configs.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Crawler Configurations</h2>
        <Button onClick={fetchConfigs} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {configs.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          No crawler configurations found
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <Card key={config.id} className="p-4">
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{config.name}</h3>
                    <p className="text-sm text-gray-500">{config.description}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(config.status)}`}>
                    {config.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Target URL:</span>
                    <div className="truncate">{config.targetUrl}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Schedule:</span>
                    <div>{config.schedule}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Rate Limit:</span>
                    <div>{config.rateLimit} req/sec</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Run:</span>
                    <div>
                      {config.lastRunAt
                        ? new Date(config.lastRunAt).toLocaleString()
                        : 'Never'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => handleRunCrawler(config.id)}
                    variant="outline"
                    size="sm"
                  >
                    Run Now
                  </Button>
                  <Link
                    href={`/admin/crawler/${config.id}/edit`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 