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
  name: string;
  type: 'PERFORMANCE' | 'REVENUE' | 'CUSTOMER' | 'CUSTOM';
  timeframe: TimeFrame;
  sections: ('orders' | 'customers' | 'revenue' | 'pools')[];
  metrics: string[];
  dimensions: string[];
  filters: {
    from: string;
    to: string;
    [key: string]: string;
  };
  format: 'JSON' | 'CSV' | 'PDF';
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

// Raw database types
export interface RawOrderTrend {
  date: Date;
  orders: bigint;
}

export interface RawCustomerSegment {
  name: string;
  value: bigint;
}

export interface RawCategoryMetric {
  category: string;
  orders: bigint;
  revenue: bigint;
}

export interface RawRepeatRate {
  repeat_rate: number;
}

export interface RawAverageOrders {
  avg_orders: number;
}

// Error handling types
export interface AnalyticsError extends Error {
  code?: string;
  details?: unknown;
} 