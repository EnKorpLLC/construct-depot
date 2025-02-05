import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card } from '@/components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

interface ChartData {
  name: string;
  value: number;
  previousValue?: number;
}

interface DashboardChartsProps {
  ordersData: ChartData[];
  revenueData: ChartData[];
  timeRange?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  onTimeRangeChange?: (range: string) => void;
}

export function DashboardCharts({ 
  ordersData, 
  revenueData, 
  timeRange = 'monthly',
  onTimeRangeChange 
}: DashboardChartsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<typeof timeRange>('monthly');

  const handleTimeRangeChange = (value: typeof timeRange) => {
    setSelectedTimeRange(value);
    onTimeRangeChange?.(value);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end mb-4">
        <Select
          value={selectedTimeRange}
          onValueChange={handleTimeRangeChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orders Chart */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Orders Overview</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Current Period" fill="#1c237e" />
                <Bar dataKey="previousValue" name="Previous Period" fill="#e65003" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue Chart */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Revenue Trends</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Current Period" 
                  stroke="#1c237e" 
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="previousValue" 
                  name="Previous Period" 
                  stroke="#e65003" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
} 