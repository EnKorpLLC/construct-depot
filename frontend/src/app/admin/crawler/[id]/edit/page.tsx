'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfigurationForm from '@/components/crawler/ConfigurationForm';
import { CrawlerConfig } from '@/types/crawler';

interface EditCrawlerConfigProps {
  params: {
    id: string;
  };
}

export default function EditCrawlerConfig({ params }: EditCrawlerConfigProps) {
  const router = useRouter();
  const [config, setConfig] = useState<CrawlerConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`/api/crawler/config/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch configuration');
        }
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [params.id]);

  const handleSubmit = async (updatedConfig: Partial<CrawlerConfig>) => {
    const response = await fetch(`/api/crawler/config/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedConfig),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update configuration');
    }

    router.push('/admin/crawler');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          Configuration not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Crawler Configuration</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <ConfigurationForm onSubmit={handleSubmit} initialData={config} />
      </div>
    </div>
  );
} 