export interface DashboardStatistics {
  ordersThisMonth: number;
  totalRevenue: number;
  averageOrderValue: number;
  customerSatisfaction: number;
}

export interface DashboardNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  timestamp: Date;
  isRead: boolean;
}

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

export interface DashboardData {
  stats: DashboardStats;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
  }>;
  recommendations: Array<{
    id: string;
    type: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  statistics: DashboardStatistics;
  notifications: DashboardNotification[];
} 