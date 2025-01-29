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

export interface TopCategory {
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
  topCategories: TopCategory[];
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  averageOrder: number;
}

export interface RevenueMetricsData {
  totalRevenue: number;
  averageOrderValue: number;
  revenueGrowth: number;
  revenueTrends: RevenueTrend[];
}

export interface PoolProgress {
  poolId: string;
  progress: number;
  totalValue: number;
  participants: number;
}

export interface PoolMetricsData {
  activePools: number;
  completedPools: number;
  totalValue: number;
  poolProgress: PoolProgress[];
}

export type ReportStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ReportConfig {
  name: string;
  type: 'PERFORMANCE' | 'REVENUE' | 'CUSTOMER' | 'CUSTOM';
  metrics: string[];
  dimensions: string[];
  filters: {
    from: string;
    to: string;
    [key: string]: any;
  };
  format: 'JSON' | 'CSV' | 'PDF';
}

export interface AnalyticsReport {
  id: string;
  name: string;
  status: ReportStatus;
  createdAt: string;
  completedAt?: string;
  config: ReportConfig;
  results?: any;
  error?: string;
} 