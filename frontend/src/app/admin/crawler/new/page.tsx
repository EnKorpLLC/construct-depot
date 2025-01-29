'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '/src/components/ui/Button';
import { ConfigurationForm } from '/src/components/crawler/ConfigurationForm';

interface CrawlerConfig {
  name: string;
  description: string;
  targetUrl: string;
  schedule: string;
  rateLimit: number;
}

export default function NewCrawlerPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CrawlerConfig) => {
    try {
      const response = await fetch('/api/crawler/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create configuration');
      router.push('/admin/crawler');
    } catch (error) {
      setError('Failed to create configuration');
      console.error('Error:', error);
    }
  };

  const initialData: CrawlerConfig = {
    name: '',
    description: '',
    targetUrl: '',
    schedule: '0 0 * * *', // Default to daily at midnight
    rateLimit: 1000, // Default to 1 request per second
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push('/admin/crawler')}>
          Back to Crawler Management
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Create New Crawler Configuration</h1>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6">
        <ConfigurationForm
          initialData={initialData}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
} 