export type TimeFrame = 'week' | 'month' | 'year';

export interface OrderTrend {
  date: string;
  orders: number;
}

export interface OrderMetricsData {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  orderTrends: OrderTrend[];
}

export interface CustomerSegment {
  name: string;
  value: number;
}

export interface CategoryMetric {
  category: string;
  orders: number;
  revenue: number;
}

export interface CustomerMetricsData {
  totalCustomers: number;
  newCustomers: number;
  repeatRate: number;
  averageOrdersPerCustomer: number;
  customerSegments: CustomerSegment[];
  topCategories: CategoryMetric[];
}

export interface RevenueTrend {
  date: string;
  amount: number;
}

export interface RevenueMetricsData {
  totalRevenue: number;
  averageOrderValue: number;
  revenueGrowth: number;
  revenueTrends: RevenueTrend[];
}

export interface PoolMetricsData {
  totalPools: number;
  activePools: number;
  averagePoolSize: number;
  totalSavings: number;
  poolTrends: {
    date: string;
    pools: number;
    participants: number;
  }[];
}

export interface ReportConfig {
  timeframe: TimeFrame;
  sections: ('orders' | 'customers' | 'revenue' | 'pools')[];
  format: 'pdf' | 'csv' | 'json';
}

export interface AnalyticsReport {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  config: ReportConfig;
  url?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
} 