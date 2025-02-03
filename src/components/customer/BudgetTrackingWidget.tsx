'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Filter,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import CustomerDashboardService from '@/services/customer/dashboardService';
import useWebSocket from '@/hooks/useWebSocket';

interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  status: 'on_track' | 'warning' | 'over_budget';
}

interface Expense {
  id: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  receipt?: string;
}

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  projectedOverage: number;
  recentExpenses: number;
  pendingApprovals: number;
}

export default function BudgetTrackingWidget({ projectId }: { projectId: string }) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        const [categoriesData, summaryData] = await Promise.all([
          CustomerDashboardService.getBudgetCategories(projectId),
          CustomerDashboardService.getBudgetSummary(projectId)
        ]);
        setCategories(categoriesData);
        setSummary({
          ...summaryData,
          projectedOverage: summaryData.projectedOverage || 0,
          recentExpenses: summaryData.recentExpenses || 0,
          pendingApprovals: summaryData.pendingApprovals || 0
        });
        setError(null);
      } catch (err) {
        setError('Failed to load budget data. Please try again later.');
        console.error('Error fetching budget data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetData();
  }, [projectId]);

  // WebSocket subscriptions for real-time updates
  useWebSocket({
    url: `ws://localhost:3000/api/ws?projectId=${projectId}`,
    onMessage: (message) => {
      if (message.type === 'budget_category_updated') {
        const update = message.payload as { projectId: string; category: BudgetCategory };
        if (update.projectId === projectId) {
          setCategories(prev =>
            prev.map(category =>
              category.name === update.category.name ? update.category : category
            )
          );
        }
      }
    }
  });

  useWebSocket({
    url: `ws://localhost:3000/api/ws?projectId=${projectId}`,
    onMessage: (message) => {
      if (message.type === 'expense_added') {
        const update = message.payload as { projectId: string; expense: Expense };
        if (update.projectId === projectId) {
          setExpenses(prev => [...prev, update.expense]);
        }
      }
    }
  });

  useWebSocket({
    url: `ws://localhost:3000/api/ws?projectId=${projectId}`,
    onMessage: (message) => {
      if (message.type === 'budget_summary_updated') {
        const update = message.payload as { projectId: string; summaryData: BudgetSummary };
        if (update.projectId === projectId) {
          setSummary(update.summaryData);
        }
      }
    }
  });

  const handleAddExpense = async (expense: Omit<Expense, 'id' | 'date' | 'status'>) => {
    try {
      await CustomerDashboardService.addExpense(projectId, expense);
      // No need to update state here as it will be handled by WebSocket
    } catch (err) {
      console.error('Error adding expense:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-grey-darker">Budget Tracking</h2>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-darker"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-grey-darker">Budget Tracking</h2>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">{error || 'Failed to load budget data'}</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-grey-darker">Budget Tracking</h2>
          <Button variant="outline" size="sm">
            Download Report
          </Button>
        </div>

        {/* Budget Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-blue-darker" />
              <span className="text-xs text-blue-darker font-medium">Total Budget</span>
            </div>
            <div className="text-2xl font-bold text-blue-700 mb-1">
              ${(summary.totalBudget / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-blue-darker">
              ${(summary.totalRemaining / 1000).toFixed(0)}k remaining
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Spent</span>
            </div>
            <div className="text-2xl font-bold text-green-700 mb-1">
              ${(summary.totalSpent / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-green-600">
              {Math.round((summary.totalSpent / summary.totalBudget) * 100)}% of budget
            </div>
          </div>

          <div className={`${summary.projectedOverage > 0 ? 'bg-red-50' : 'bg-green-50'} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className={`h-5 w-5 ${summary.projectedOverage > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <span className={`text-xs font-medium ${summary.projectedOverage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                Projected
              </span>
            </div>
            <div className={`text-2xl font-bold mb-1 ${summary.projectedOverage > 0 ? 'text-red-700' : 'text-green-700'}`}>
              {summary.projectedOverage > 0 ? '+' : ''}${(Math.abs(summary.projectedOverage) / 1000).toFixed(0)}k
            </div>
            <div className={`text-xs ${summary.projectedOverage > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.projectedOverage > 0 ? 'Projected overrun' : 'Under budget'}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-grey-darker mb-4">Budget Categories</h3>
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-grey-darker">{category.name}</span>
                  <span className="text-xs text-grey-lighter ml-2">
                    ${category.spent.toLocaleString()} of ${category.allocated.toLocaleString()}
                  </span>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full
                  ${category.status === 'on_track' ? 'bg-green-100 text-green-800' :
                    category.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'}`}
                >
                  {category.status === 'on_track' ? 'On Track' :
                    category.status === 'warning' ? 'Warning' : 'Over Budget'}
                </div>
                <Progress
                  value={Math.min(100, (category.spent / category.allocated) * 100)}
                  className={category.status === 'over_budget' ? 'bg-red-100' : ''}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-grey-darker">Recent Expenses</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="space-y-2">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 bg-grey-lighter/10 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <FileText className="h-5 w-5 text-grey-lighter" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-grey-darker">
                      {expense.description}
                    </div>
                    <div className="text-xs text-grey-lighter">
                      {expense.category} • {expense.date.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm font-medium px-2 py-1 rounded
                    ${expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                      expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'}`}
                  >
                    ${expense.amount.toLocaleString()}
                  </span>
                  {expense.receipt && (
                    <Button variant="ghost" size="sm">
                      View Receipt
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 bg-grey-lighter/10 rounded-lg p-4">
            <ArrowUpRight className="h-5 w-5 text-grey-lighter" />
            <div>
              <div className="text-lg font-bold">${summary.recentExpenses}</div>
              <div className="text-sm text-grey-lighter">Recent Expenses</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-grey-lighter/10 rounded-lg p-4">
            <ArrowDownRight className="h-5 w-5 text-grey-lighter" />
            <div>
              <div className="text-lg font-bold">${summary.pendingApprovals}</div>
              <div className="text-sm text-grey-lighter">Pending Approvals</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 