export interface DashboardStatistics {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  savings: number;
}

export interface DashboardNotification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
}

export interface DashboardData {
  recentOrders: any[]; // TODO: Replace with proper Order type
  statistics: DashboardStatistics;
  notifications: DashboardNotification[];
} 