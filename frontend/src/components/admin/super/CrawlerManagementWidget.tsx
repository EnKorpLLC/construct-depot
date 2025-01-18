'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CrawlerConfig {
  id: string;
  name: string;
  status: string;
  lastRunAt?: string;
  schedule: string;
}

export default function CrawlerManagementWidget() {
  const [configs, setConfigs] = useState<CrawlerConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/crawler/configs');
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      console.error('Failed to fetch crawler configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCrawler = async (configId: string) => {
    try {
      await fetch(`/api/crawler/configs/${configId}/run`, {
        method: 'POST',
      });
      await fetchConfigs(); // Refresh the list
    } catch (error) {
      console.error('Failed to run crawler:', error);
    }
  };

  if (loading) {
    return <div>Loading crawler configurations...</div>;
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Crawler Management</h2>
        <Link href="/admin/crawler/new">
          <Button>New Crawler</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {configs.map((config) => (
          <div
            key={config.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <h3 className="font-medium">{config.name}</h3>
              <p className="text-sm text-gray-500">
                Schedule: {config.schedule || 'Not scheduled'}
              </p>
              {config.lastRunAt && (
                <p className="text-sm text-gray-500">
                  Last run: {new Date(config.lastRunAt).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex space-x-2">
              <Link href={`/admin/crawler/${config.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={() => handleRunCrawler(config.id)}
                disabled={config.status === 'running'}
              >
                {config.status === 'running' ? 'Running...' : 'Run Now'}
              </Button>
            </div>
          </div>
        ))}

        {configs.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No crawler configurations found
          </div>
        )}
      </div>
    </Card>
  );
} 