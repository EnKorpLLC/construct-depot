'use client';

import { useRouter } from 'next/navigation';
import ConfigurationForm from '@/components/crawler/ConfigurationForm';
import { CrawlerConfig } from '@/types/crawler';

export default function NewCrawlerConfig() {
  const router = useRouter();

  const handleSubmit = async (config: Partial<CrawlerConfig>) => {
    const response = await fetch('/api/crawler/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create configuration');
    }

    router.push('/admin/crawler');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">New Crawler Configuration</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <ConfigurationForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
} 