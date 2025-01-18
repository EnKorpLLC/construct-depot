'use client';

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import { CustomerDashboardService } from '@/lib/services/customer/dashboardService';

interface Stats {
  totalSpent: number;
  activeProjects: number;
  pendingOrders: number;
  savings: number;
  spentTrend: number;
  projectsTrend: number;
  ordersTrend: number;
  savingsTrend: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalSpent: 0,
    activeProjects: 0,
    pendingOrders: 0,
    savings: 0,
    spentTrend: 0,
    projectsTrend: 0,
    ordersTrend: 0,
    savingsTrend: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const projects = await CustomerDashboardService.getProjects();
        const budgetSummary = await CustomerDashboardService.getBudgetSummary('all');

        // Calculate stats from the data
        const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
        const activeProjects = projects.filter(p => p.status === 'in_progress').length;
        const savings = projects.reduce((sum, p) => sum + (p.budget - p.spent), 0);

        setStats({
          totalSpent,
          activeProjects,
          pendingOrders: 5, // TODO: Get from order service
          savings,
          spentTrend: 12.5,
          projectsTrend: 8.2,
          ordersTrend: -3.1,
          savingsTrend: 15.3
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderTrend = (value: number) => {
    const Icon = value >= 0 ? ArrowUpIcon : ArrowDownIcon;
    const color = value >= 0 ? 'text-green-500' : 'text-red-500';
    return (
      <div className={`flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span>{Math.abs(value)}%</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Spent */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(stats.totalSpent)}
          </p>
          {renderTrend(stats.spentTrend)}
        </div>
      </div>

      {/* Active Projects */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-500">Active Projects</h3>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-semibold text-gray-900">
            {stats.activeProjects}
          </p>
          {renderTrend(stats.projectsTrend)}
        </div>
      </div>

      {/* Pending Orders */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-500">Pending Orders</h3>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-semibold text-gray-900">
            {stats.pendingOrders}
          </p>
          {renderTrend(stats.ordersTrend)}
        </div>
      </div>

      {/* Total Savings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-500">Total Savings</h3>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(stats.savings)}
          </p>
          {renderTrend(stats.savingsTrend)}
        </div>
      </div>
    </div>
  );
} 