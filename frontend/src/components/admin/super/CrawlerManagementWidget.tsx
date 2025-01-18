'use client';

import { useEffect, useState } from 'react';
import { PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface CrawlerJob {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  lastRun: string;
  nextRun: string;
  targetUrl: string;
  itemsProcessed: number;
}

export default function CrawlerManagementWidget() {
  const [jobs, setJobs] = useState<CrawlerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call when endpoint is ready
        const response = await fetch('/api/admin/crawler/jobs');
        const data = await response.json();
        setJobs(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch crawler jobs');
        console.error('Error fetching crawler jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  const handleJobAction = async (jobId: string, action: 'start' | 'pause' | 'restart') => {
    try {
      const response = await fetch(`/api/admin/crawler/jobs/${jobId}/${action}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} job`);
      }

      // Refresh jobs list
      setLoading(true);
    } catch (err) {
      setError(`Failed to ${action} job`);
      console.error(`Error ${action}ing job:`, err);
    }
  };

  if (loading) {
  return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
      <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
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

  const getStatusColor = (status: CrawlerJob['status']) => {
    switch (status) {
      case 'running': return 'text-green-500';
      case 'paused': return 'text-yellow-500';
      case 'completed': return 'text-blue-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Crawler Management</h2>
        <Link
          href="/admin/crawler/new"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          New Crawler
        </Link>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
        <div>
                <h3 className="font-medium text-gray-900">{job.name}</h3>
                <p className="text-sm text-gray-500">{job.targetUrl}</p>
        </div>
              <div className={`font-medium ${getStatusColor(job.status)}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </div>
      </div>

            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Progress</span>
          <span>{job.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${job.progress}%` }}
          />
        </div>
      </div>

            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-500">
                Items: {job.itemsProcessed}
      </div>
              <div className="space-x-2">
                {job.status === 'running' ? (
                  <button
                    onClick={() => handleJobAction(job.id, 'pause')}
                    className="p-1 text-yellow-500 hover:text-yellow-600"
                    title="Pause"
                  >
                    <PauseIcon className="h-5 w-5" />
                  </button>
                ) : (
            <button
                    onClick={() => handleJobAction(job.id, 'start')}
                    className="p-1 text-green-500 hover:text-green-600"
                    title="Start"
                  >
                    <PlayIcon className="h-5 w-5" />
            </button>
                )}
            <button
                  onClick={() => handleJobAction(job.id, 'restart')}
                  className="p-1 text-blue-500 hover:text-blue-600"
                  title="Restart"
            >
                  <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
            </div>
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No crawler jobs found. Create a new one to get started.
          </div>
        )}
      </div>
    </div>
  );
} 