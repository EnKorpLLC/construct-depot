'use client';

import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import {
  TrendingUp,
  Award,
  Clock,
  DollarSign,
  ThumbsUp,
  Users,
  BarChart2,
  Calendar,
} from 'lucide-react';

interface PerformanceMetrics {
  projectSuccessRate: number;
  onTimeDeliveryRate: number;
  clientSatisfactionScore: number;
  averageBidWinRate: number;
  revenueGrowth: number;
  activeProjects: number;
  completedProjects: number;
  teamUtilization: number;
  qualityScore: number;
  safetyRecord: number;
  monthlyStats: {
    month: string;
    revenue: number;
    projects: number;
    utilization: number;
  }[];
}

export default function PerformanceAnalyticsWidget() {
  // Mock data - will be replaced with API calls
  const metrics: PerformanceMetrics = {
    projectSuccessRate: 92,
    onTimeDeliveryRate: 88,
    clientSatisfactionScore: 4.8,
    averageBidWinRate: 35,
    revenueGrowth: 24,
    activeProjects: 8,
    completedProjects: 45,
    teamUtilization: 85,
    qualityScore: 95,
    safetyRecord: 100,
    monthlyStats: [
      { month: 'Jan', revenue: 120000, projects: 4, utilization: 80 },
      { month: 'Feb', revenue: 150000, projects: 5, utilization: 85 },
      { month: 'Mar', revenue: 180000, projects: 6, utilization: 90 },
    ],
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Performance Analytics</h2>
          <span className="text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString()}</span>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-blue-700 mb-1">
              {metrics.projectSuccessRate}%
            </div>
            <div className="text-xs text-blue-600">Project Success Rate</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span className="text-xs text-green-600 font-medium">On-Time</span>
            </div>
            <div className="text-2xl font-bold text-green-700 mb-1">
              {metrics.onTimeDeliveryRate}%
            </div>
            <div className="text-xs text-green-600">Delivery Rate</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <ThumbsUp className="h-5 w-5 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">Satisfaction</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 mb-1">
              {metrics.clientSatisfactionScore}
            </div>
            <div className="text-xs text-purple-600">Client Rating</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <span className="text-xs text-orange-600 font-medium">Growth</span>
            </div>
            <div className="text-2xl font-bold text-orange-700 mb-1">
              +{metrics.revenueGrowth}%
            </div>
            <div className="text-xs text-orange-600">Revenue Growth</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700">Performance Metrics</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Bid Win Rate</span>
                <span className="font-medium">{metrics.averageBidWinRate}%</span>
              </div>
              <Progress value={metrics.averageBidWinRate} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Team Utilization</span>
                <span className="font-medium">{metrics.teamUtilization}%</span>
              </div>
              <Progress value={metrics.teamUtilization} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Quality Score</span>
                <span className="font-medium">{metrics.qualityScore}%</span>
              </div>
              <Progress value={metrics.qualityScore} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Safety Record</span>
                <span className="font-medium">{metrics.safetyRecord}%</span>
              </div>
              <Progress value={metrics.safetyRecord} className="h-2" />
            </div>
          </div>
        </div>

        {/* Monthly Performance */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Monthly Performance</h3>
          <div className="grid grid-cols-3 gap-4">
            {metrics.monthlyStats.map((stat, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">{stat.month}</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Revenue</span>
                    <span className="text-xs font-medium">
                      ${(stat.revenue / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Projects</span>
                    <span className="text-xs font-medium">{stat.projects}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Utilization</span>
                    <span className="text-xs font-medium">{stat.utilization}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
            <Users className="h-5 w-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Active Projects</div>
              <div className="text-lg font-semibold">{metrics.activeProjects}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
            <BarChart2 className="h-5 w-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Completed Projects</div>
              <div className="text-lg font-semibold">{metrics.completedProjects}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 