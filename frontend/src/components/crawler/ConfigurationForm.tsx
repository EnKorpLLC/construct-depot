'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CrawlerConfig {
  name: string;
  description: string;
  targetUrl: string;
  schedule: string;
  rateLimit: number;
}

interface ConfigurationFormProps {
  initialData?: CrawlerConfig;
  onSubmit: (data: CrawlerConfig) => Promise<void>;
}

export function ConfigurationForm({ initialData, onSubmit }: ConfigurationFormProps) {
  const [config, setConfig] = useState<CrawlerConfig>(
    initialData || {
      name: '',
      description: '',
      targetUrl: '',
      schedule: '0 0 * * *',
      rateLimit: 1000,
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(config);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: name === 'rateLimit' ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={config.name}
          onChange={handleChange}
          required
          placeholder="Crawler name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={config.description}
          onChange={handleChange}
          required
          placeholder="Describe the purpose of this crawler"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetUrl">Target URL</Label>
        <Input
          id="targetUrl"
          name="targetUrl"
          type="url"
          value={config.targetUrl}
          onChange={handleChange}
          required
          placeholder="https://example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="schedule">Schedule (Cron Expression)</Label>
        <Input
          id="schedule"
          name="schedule"
          value={config.schedule}
          onChange={handleChange}
          required
          placeholder="0 0 * * *"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rateLimit">Rate Limit (requests per second)</Label>
        <Input
          id="rateLimit"
          name="rateLimit"
          type="number"
          min="1"
          max="10000"
          value={config.rateLimit}
          onChange={handleChange}
          required
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
      </Button>
    </form>
  );
} 