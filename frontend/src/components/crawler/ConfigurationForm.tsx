'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CrawlerConfig {
  name: string;
  description: string;
  targetUrl: string;
  schedule: string;
  rateLimit: number;
}

export default function ConfigurationForm({ 
  initialData,
  onSubmit 
}: { 
  initialData?: CrawlerConfig;
  onSubmit: (data: CrawlerConfig) => void;
}) {
  const [config, setConfig] = useState<CrawlerConfig>(initialData || {
    name: '',
    description: '',
    targetUrl: '',
    schedule: '',
    rateLimit: 60
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={config.name}
          onChange={(e) => setConfig({ ...config, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={config.description}
          onChange={(e) => setConfig({ ...config, description: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="targetUrl">Target URL</Label>
        <Input
          id="targetUrl"
          type="url"
          value={config.targetUrl}
          onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="schedule">Schedule (cron expression)</Label>
        <Input
          id="schedule"
          value={config.schedule}
          onChange={(e) => setConfig({ ...config, schedule: e.target.value })}
          placeholder="*/15 * * * *"
        />
      </div>
      
      <div>
        <Label htmlFor="rateLimit">Rate Limit (requests per minute)</Label>
        <Input
          id="rateLimit"
          type="number"
          min="1"
          max="1000"
          value={config.rateLimit}
          onChange={(e) => setConfig({ ...config, rateLimit: parseInt(e.target.value) })}
          required
        />
      </div>
      
      <Button type="submit">Save Configuration</Button>
    </form>
  );
} 