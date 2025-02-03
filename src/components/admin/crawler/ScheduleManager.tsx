'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Calendar, Clock, Play, Pause, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface CrawlerSchedule {
  id: string;
  url: string;
  frequency: string;
  lastCrawled?: Date;
  nextCrawl: Date;
  isActive: boolean;
  domain: string;
}

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState<CrawlerSchedule[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newFrequency, setNewFrequency] = useState('daily');

  const addSchedule = async () => {
    try {
      const response = await fetch('/api/admin/crawler/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, frequency: newFrequency }),
      });

      if (!response.ok) throw new Error('Failed to add schedule');

      const data = await response.json();
      setSchedules([...schedules, data]);
      setNewUrl('');
      toast.success('Schedule added successfully');
    } catch (error) {
      toast.error('Failed to add schedule');
    }
  };

  const toggleSchedule = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/crawler/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error('Failed to update schedule');

      setSchedules(schedules.map(s => 
        s.id === id ? { ...s, isActive } : s
      ));
      toast.success('Schedule updated successfully');
    } catch (error) {
      toast.error('Failed to update schedule');
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/crawler/schedules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete schedule');

      setSchedules(schedules.filter(s => s.id !== id));
      toast.success('Schedule deleted successfully');
    } catch (error) {
      toast.error('Failed to delete schedule');
    }
  };

  const runNow = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/crawler/schedules/${id}/run`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to run crawler');

      toast.success('Crawler started successfully');
    } catch (error) {
      toast.error('Failed to run crawler');
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Crawler Schedules</h2>
        
        {/* Add new schedule */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Enter URL to crawl"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1"
          />
          <Select
            value={newFrequency}
            onValueChange={setNewFrequency}
          >
            {FREQUENCIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Button onClick={addSchedule}>Add Schedule</Button>
        </div>

        {/* Schedule list */}
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{schedule.url}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {schedule.frequency}
                  </span>
                  {schedule.lastCrawled && (
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Last: {new Date(schedule.lastCrawled).toLocaleDateString()}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Next: {new Date(schedule.nextCrawl).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runNow(schedule.id)}
                >
                  Run Now
                </Button>
                <Button
                  variant={schedule.isActive ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => toggleSchedule(schedule.id, !schedule.isActive)}
                >
                  {schedule.isActive ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteSchedule(schedule.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 