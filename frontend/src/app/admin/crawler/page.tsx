'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '/src/components/ui/Button';
import { CrawlerManagementWidget } from '/src/components/admin/super/CrawlerManagementWidget';
import { JobMonitoringDashboard } from '/src/components/crawler/JobMonitoringDashboard';

export default function CrawlerManagementPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Crawler Management</h1>
        <Button onClick={() => router.push('/admin/crawler/new')}>
          Create New Configuration
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid gap-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Crawler Configurations</h2>
          <CrawlerManagementWidget />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Job Monitoring</h2>
          <JobMonitoringDashboard />
        </div>
      </div>
    </div>
  );
} 