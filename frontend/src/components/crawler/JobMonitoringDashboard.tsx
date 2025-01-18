import { useState, useEffect } from 'react';
import { CrawlerJob, CrawlerConfig } from '@/types/crawler';

interface JobMonitoringDashboardProps {
  configId?: string;
}

export default function JobMonitoringDashboard({ configId }: JobMonitoringDashboardProps) {
  const [jobs, setJobs] = useState<(CrawlerJob & { config: CrawlerConfig })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const url = configId 
          ? `/api/crawler/job?configId=${configId}`
          : '/api/crawler/job';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const data = await response.json();
        setJobs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [configId]);

  const handleStopJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/crawler/job`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId, action: 'stop' }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop job');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop job');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Jobs</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {jobs.filter(job => job.status === 'running').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Completed Jobs</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {jobs.filter(job => job.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Failed Jobs</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {jobs.filter(job => job.status === 'failed').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Items Found</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {jobs.reduce((sum, job) => sum + job.itemsFound, 0)}
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Jobs</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {jobs.map(job => (
              <li key={job.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {job.config.name}
                      </p>
                      <div className="ml-2 flex-shrink-0">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${job.status === 'running' ? 'bg-green-100 text-green-800' :
                            job.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            job.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Pages: {job.pagesProcessed} | Items: {job.itemsFound}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Started: {new Date(job.startTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  {job.status === 'running' && (
                    <div className="ml-4">
                      <button
                        onClick={() => handleStopJob(job.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Stop
                      </button>
                    </div>
                  )}
                </div>
                {job.errors.length > 0 && selectedJob === job.id && (
                  <div className="mt-2">
                    <div className="bg-red-50 p-4 rounded-md">
                      <ul className="list-disc pl-5 space-y-1">
                        {job.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-700">
                            {error.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {job.errors.length > 0 && (
                  <button
                    onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                    className="mt-2 text-sm text-red-600 hover:text-red-500"
                  >
                    {selectedJob === job.id ? 'Hide Errors' : `Show Errors (${job.errors.length})`}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 