'use client';

import { useState } from 'react';
import { CrawlerConfig } from '@/types/crawler';

interface ConfigFormProps {
  initialData?: Partial<CrawlerConfig>;
  onSubmit: (data: Partial<CrawlerConfig>) => Promise<void>;
  onCancel: () => void;
}

export default function ConfigForm({ initialData, onSubmit, onCancel }: ConfigFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    targetUrl: initialData?.targetUrl || '',
    schedule: initialData?.schedule || '',
    rateLimit: initialData?.rateLimit || 30,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rateLimit' ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700">
          Target URL
        </label>
        <input
          type="url"
          id="targetUrl"
          name="targetUrl"
          value={formData.targetUrl}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="schedule" className="block text-sm font-medium text-gray-700">
          Schedule (Cron Expression)
        </label>
        <input
          type="text"
          id="schedule"
          name="schedule"
          value={formData.schedule}
          onChange={handleChange}
          placeholder="*/30 * * * *"
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Leave empty for manual execution only
        </p>
      </div>

      <div>
        <label htmlFor="rateLimit" className="block text-sm font-medium text-gray-700">
          Rate Limit (requests per minute)
        </label>
        <input
          type="number"
          id="rateLimit"
          name="rateLimit"
          value={formData.rateLimit}
          onChange={handleChange}
          min="1"
          max="60"
          required
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
} 