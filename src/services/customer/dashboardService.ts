import { DashboardData } from '@/types/dashboard';

export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  totalSpent: number;
  recentOrders: Array<{
    id: string;
    createdAt: Date;
    status: string;
    totalAmount: number;
  }>;
}

export interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
}

export interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  spendingTrend: Array<{
    date: string;
    amount: number;
  }>;
}

export const dashboardService = {
  async getProjects(): Promise<Project[]> {
    // TODO: Implement actual API call to fetch projects
    return [];
  },

  async getBudgetCategories(projectId: string): Promise<BudgetCategory[]> {
    // TODO: Implement actual API call to fetch budget categories
    return [];
  },

  async getBudgetSummary(projectId: string): Promise<BudgetSummary> {
    // TODO: Implement actual API call to fetch budget summary
    return {
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      spendingTrend: []
    };
  },

  async getUserStats(userId: string): Promise<DashboardStats> {
    // TODO: Implement actual API call
    return {
      totalOrders: 0,
      activeOrders: 0,
      totalSpent: 0,
      recentOrders: []
    };
  },

  async getRecommendations(userId: string) {
    // TODO: Implement product recommendations
    return [];
  },

  async getDashboardData(): Promise<DashboardData> {
    // TODO: Implement actual API call
    return {
      recentOrders: [],
      statistics: {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        savings: 0
      },
      notifications: []
    };
  },

  async getNotifications() {
    // TODO: Implement notifications fetch
    return [];
  },

  async getRecentActivity() {
    // TODO: Implement recent activity fetch
    return [];
  }
};

export default dashboardService; 