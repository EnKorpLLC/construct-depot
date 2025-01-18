'use client';

import { useState, useEffect } from 'react';
import { CrawlerJob, CrawlerStats } from '@/types/crawler';

interface MonitoringDashboardProps {
  configId: string;
}

export default function MonitoringDashboard({ configId }: MonitoringDashboardProps) {
  const [jobs, setJobs] = useState<CrawlerJob[]>([]);
  const [stats, setStats] = useState<CrawlerStats>({
    totalJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
    averageProcessingTime: 0,
    totalItemsFound: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/crawler/job?configId=${configId}`);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const data = await response.json();
        setJobs(data);
        calculateStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [configId]);

  const calculateStats = (jobs: CrawlerJob[]) => {
    const completed = jobs.filter(job => job.status === 'completed');
    const failed = jobs.filter(job => job.status === 'failed');
    
    const processingTimes = completed.map(job => 
      job.endTime ? new Date(job.endTime).getTime() - new Date(job.startTime).getTime() : 0
    );

    const avgTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

    const totalItems = jobs.reduce((sum, job) => sum + job.itemsFound, 0);

    setStats({
      totalJobs: jobs.length,
      successfulJobs: completed.length,
      failedJobs: failed.length,
      averageProcessingTime: avgTime,
      totalItemsFound: totalItems,
    });
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Error: {error}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {stats.totalJobs > 0
              ? Math.round((stats.successfulJobs / stats.totalJobs) * 100)
              : 0}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Items Found</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {stats.totalItemsFound}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg. Processing Time</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {Math.round(stats.averageProcessingTime / 1000)}s
          </p>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Jobs</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {jobs.map(job => (
              <li key={job.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Job ID: {job.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      Started: {new Date(job.startTime).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Items Found: {job.itemsFound}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 text-sm rounded-full ${
                        job.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : job.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : job.status === 'running'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
                {job.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-600">Errors:</p>
                    <ul className="mt-1 text-sm text-red-500">
                      {job.errors.map((error, index) => (
                        <li key={index}>{error.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 