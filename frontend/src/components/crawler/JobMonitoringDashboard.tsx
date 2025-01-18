'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CrawlerJob {
  id: string;
  configId: string;
  startTime: string;
  endTime?: string;
  status: string;
  pagesProcessed: number;
  itemsFound: number;
  errors: any[];
}

export default function JobMonitoringDashboard() {
  const [jobs, setJobs] = useState<CrawlerJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/crawler/jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div>Loading jobs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Crawler Jobs</h2>
        <Button onClick={fetchJobs}>Refresh</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
              <span className="text-sm text-gray-500">
                {new Date(job.startTime).toLocaleString()}
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Pages Processed:</span>
                <span className="ml-2 font-medium">{job.pagesProcessed}</span>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Items Found:</span>
                <span className="ml-2 font-medium">{job.itemsFound}</span>
              </div>

              {job.errors.length > 0 && (
                <div>
                  <span className="text-sm text-red-500">
                    Errors: {job.errors.length}
                  </span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No crawler jobs found
        </div>
      )}
    </div>
  );
} 