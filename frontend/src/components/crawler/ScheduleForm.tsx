import { useState, useEffect } from 'react';
import { ScheduleConfig, ScheduleFrequency } from '@/types/crawler';

interface ScheduleFormProps {
  value: ScheduleConfig;
  onChange: (schedule: ScheduleConfig) => void;
}

const FREQUENCY_OPTIONS: { value: ScheduleFrequency; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function ScheduleForm({ value, onChange }: ScheduleFormProps) {
  const [schedule, setSchedule] = useState<ScheduleConfig>(value);

  useEffect(() => {
    onChange(schedule);
  }, [schedule, onChange]);

  const handleFrequencyChange = (frequency: ScheduleFrequency) => {
    setSchedule(prev => ({
      ...prev,
      frequency,
      // Reset frequency-specific fields when changing frequency
      customCron: frequency === 'custom' ? prev.customCron : undefined,
      dayOfWeek: frequency === 'weekly' ? prev.dayOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? prev.dayOfMonth : undefined,
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Frequency
        </label>
        <select
          value={schedule.frequency}
          onChange={(e) => handleFrequencyChange(e.target.value as ScheduleFrequency)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {FREQUENCY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {schedule.frequency !== 'once' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            value={schedule.startDate ? new Date(schedule.startDate).toISOString().split('T')[0] : ''}
            onChange={(e) => setSchedule(prev => ({
              ...prev,
              startDate: e.target.value ? new Date(e.target.value) : undefined,
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      )}

      {schedule.frequency !== 'once' && schedule.frequency !== 'hourly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Time of Day
          </label>
          <input
            type="time"
            value={schedule.timeOfDay || ''}
            onChange={(e) => setSchedule(prev => ({
              ...prev,
              timeOfDay: e.target.value,
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      )}

      {schedule.frequency === 'weekly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Day of Week
          </label>
          <select
            value={schedule.dayOfWeek}
            onChange={(e) => setSchedule(prev => ({
              ...prev,
              dayOfWeek: parseInt(e.target.value),
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {DAYS_OF_WEEK.map((day, index) => (
              <option key={index} value={index}>
                {day}
              </option>
            ))}
          </select>
        </div>
      )}

      {schedule.frequency === 'monthly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Day of Month
          </label>
          <select
            value={schedule.dayOfMonth}
            onChange={(e) => setSchedule(prev => ({
              ...prev,
              dayOfMonth: parseInt(e.target.value),
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
      )}

      {schedule.frequency === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Custom Cron Expression
          </label>
          <input
            type="text"
            value={schedule.customCron || ''}
            onChange={(e) => setSchedule(prev => ({
              ...prev,
              customCron: e.target.value,
            }))}
            placeholder="*/30 * * * *"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Use cron expression format (e.g., "*/30 * * * *" for every 30 minutes)
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          End Date (Optional)
        </label>
        <input
          type="date"
          value={schedule.endDate ? new Date(schedule.endDate).toISOString().split('T')[0] : ''}
          onChange={(e) => setSchedule(prev => ({
            ...prev,
            endDate: e.target.value ? new Date(e.target.value) : undefined,
          }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={schedule.active}
            onChange={(e) => setSchedule(prev => ({
              ...prev,
              active: e.target.checked,
            }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Schedule Active
          </span>
        </label>
      </div>
    </div>
  );
} 