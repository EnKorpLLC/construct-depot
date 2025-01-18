'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface CrawlerJob {
  id: string;
  configId: string;
  startTime: string;
  endTime?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  pagesProcessed: number;
  itemsFound: number;
  errors: string[];
}

export function JobMonitoringDashboard() {
  const [jobs, setJobs] = useState<CrawlerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crawler/jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
      setError(null);
    } catch (error) {
      setError('Failed to load jobs');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Set up polling for active jobs
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: CrawlerJob['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Active Jobs</h2>
        <Button onClick={fetchJobs} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          No crawler jobs found
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <Badge className={getStatusColor(job.status)}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </Badge>
                <span className="text-sm text-gray-500">
                  {new Date(job.startTime).toLocaleString()}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Pages Processed</span>
                  <span className="font-medium">{job.pagesProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Items Found</span>
                  <span className="font-medium">{job.itemsFound}</span>
                </div>
              </div>

              {job.errors.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium text-red-600 mb-1">
                    Errors ({job.errors.length})
                  </div>
                  <div className="text-sm text-red-500 max-h-20 overflow-y-auto">
                    {job.errors.map((error, index) => (
                      <div key={index} className="mb-1">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 