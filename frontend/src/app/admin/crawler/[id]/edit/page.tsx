'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '/src/components/ui/Button';
import { ConfigurationForm } from '/src/components/crawler/ConfigurationForm';

interface CrawlerConfig {
  id: string;
  name: string;
  description: string;
  targetUrl: string;
  schedule: string;
  rateLimit: number;
}

export default function EditCrawlerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [config, setConfig] = useState<CrawlerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, [params.id]);

  const fetchConfig = async () => {
    try {
      const response = await fetch(`/api/crawler/configs/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch configuration');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      setError('Failed to load crawler configuration');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CrawlerConfig) => {
    try {
      const response = await fetch(`/api/crawler/configs/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update configuration');
      router.push('/admin/crawler');
    } catch (error) {
      setError('Failed to update configuration');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
        <Button onClick={() => router.push('/admin/crawler')}>
          Back to Crawler Management
        </Button>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          Configuration not found
        </div>
        <Button onClick={() => router.push('/admin/crawler')}>
          Back to Crawler Management
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push('/admin/crawler')}>
          Back to Crawler Management
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Edit Crawler Configuration</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <ConfigurationForm
          initialData={config}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
} 