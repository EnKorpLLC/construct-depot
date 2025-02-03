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
          <h2 className="text-xl font-semibold text-grey-darker">Performance Analytics</h2>
          <span className="text-sm text-grey-lighter">Last Updated: {new Date().toLocaleDateString()}</span>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-lighter/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-5 w-5 text-blue-darker" />
              <span className="text-xs text-blue-darker font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-blue-darker mb-1">
              {metrics.projectSuccessRate}%
            </div>
            <div className="text-xs text-blue-darker">Project Success Rate</div>
          </div>

          <div className="bg-osb-light/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-osb-dark" />
              <span className="text-xs text-osb-dark font-medium">On-Time</span>
            </div>
            <div className="text-2xl font-bold text-osb-dark mb-1">
              {metrics.onTimeDeliveryRate}%
            </div>
            <div className="text-xs text-osb-dark">Delivery Rate</div>
          </div>

          <div className="bg-grey-lighter/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <ThumbsUp className="h-5 w-5 text-grey-darker" />
              <span className="text-xs text-grey-darker font-medium">Satisfaction</span>
            </div>
            <div className="text-2xl font-bold text-grey-darker mb-1">
              {metrics.clientSatisfactionScore}
            </div>
            <div className="text-xs text-grey-darker">Client Rating</div>
          </div>

          <div className="bg-orange-lighter/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-orange-darker" />
              <span className="text-xs text-orange-darker font-medium">Growth</span>
            </div>
            <div className="text-2xl font-bold text-orange-darker mb-1">
              +{metrics.revenueGrowth}%
            </div>
            <div className="text-xs text-orange-darker">Revenue Growth</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium text-grey-darker">Performance Metrics</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-grey-darker">Bid Win Rate</span>
                <span className="font-medium">{metrics.averageBidWinRate}%</span>
              </div>
              <Progress value={metrics.averageBidWinRate} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-grey-darker">Team Utilization</span>
                <span className="font-medium">{metrics.teamUtilization}%</span>
              </div>
              <Progress value={metrics.teamUtilization} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-grey-darker">Quality Score</span>
                <span className="font-medium">{metrics.qualityScore}%</span>
              </div>
              <Progress value={metrics.qualityScore} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-grey-darker">Safety Record</span>
                <span className="font-medium">{metrics.safetyRecord}%</span>
              </div>
              <Progress value={metrics.safetyRecord} className="h-2" />
            </div>
          </div>
        </div>

        {/* Monthly Performance */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-grey-darker">Monthly Performance</h3>
          <div className="grid grid-cols-3 gap-4">
            {metrics.monthlyStats.map((stat, index) => (
              <div key={index} className="bg-grey-lighter/20 rounded-lg p-3">
                <div className="text-xs text-grey-darker mb-1">{stat.month}</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-grey-darker">Revenue</span>
                    <span className="text-xs font-medium">
                      ${(stat.revenue / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-grey-darker">Projects</span>
                    <span className="text-xs font-medium">{stat.projects}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-grey-darker">Utilization</span>
                    <span className="text-xs font-medium">{stat.utilization}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center space-x-3 bg-grey-lighter/20 rounded-lg p-4">
            <Users className="h-5 w-5 text-grey-darker" />
            <div>
              <div className="text-sm text-grey-darker">Active Projects</div>
              <div className="text-lg font-semibold">{metrics.activeProjects}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-grey-lighter/20 rounded-lg p-4">
            <BarChart2 className="h-5 w-5 text-grey-darker" />
            <div>
              <div className="text-sm text-grey-darker">Completed Projects</div>
              <div className="text-lg font-semibold">{metrics.completedProjects}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 