'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { CustomerDashboardService } from '@/lib/services/customer/dashboardService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BudgetData {
  labels: string[];
  spent: number[];
  budget: number[];
}

export function BudgetOverview() {
  const [budgetData, setBudgetData] = useState<BudgetData>({
    labels: [],
    spent: [],
    budget: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        const dashboardService = CustomerDashboardService.getInstance();
        const data = await dashboardService.getBudgetOverview();
        setBudgetData(data);
      } catch (error) {
        console.error('Error fetching budget data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetData();
  }, []);

  const chartData = {
    labels: budgetData.labels,
    datasets: [
      {
        label: 'Spent',
        data: budgetData.spent,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Budget',
        data: budgetData.budget,
        borderColor: 'rgb(107, 114, 128)',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: (value: number) => `$${value.toLocaleString()}`
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Budget Overview</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-500">Spent</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-500">Budget</span>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total Spent</p>
          <p className="text-2xl font-semibold text-blue-700">
            ${budgetData.spent.reduce((a, b) => a + b, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600 font-medium">Total Budget</p>
          <p className="text-2xl font-semibold text-gray-700">
            ${budgetData.budget.reduce((a, b) => a + b, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
} 