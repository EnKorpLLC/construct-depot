# Supplier Dashboard Components

## Overview
The supplier dashboard consists of four main components that provide comprehensive functionality for suppliers to manage orders, track sales, analyze customer data, and monitor inventory.

## Components

### 1. OrderManagement
Location: `frontend/src/components/supplier/OrderManagement.tsx`

Purpose: Manages and displays supplier orders with filtering and status tracking.

Features:
- Order list with status filtering
- Order details view
- Status updates
- Order statistics
- Pagination support

Props:
```typescript
interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: number;
  createdAt: string;
}
```

### 2. SalesAnalytics
Location: `frontend/src/components/supplier/SalesAnalytics.tsx`

Purpose: Visualizes sales data and metrics using Chart.js.

Features:
- Revenue trend chart
- Total revenue display
- Order count metrics
- Average order value
- Top selling products list

Props:
```typescript
interface SalesData {
  labels: string[];
  revenue: number[];
  orders: number[];
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    revenue: number;
    quantity: number;
  }>;
}
```

### 3. CustomerInsights
Location: `frontend/src/components/supplier/CustomerInsights.tsx`

Purpose: Provides analytics and insights about customer behavior.

Features:
- Customer metrics overview
- Customer segmentation
- Top customers list
- Retention metrics
- Customer activity tracking

Props:
```typescript
interface CustomerInsight {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  averageCustomerValue: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    orderCount: number;
    lastOrder: string;
    status: 'active' | 'inactive';
  }>;
  customerSegments: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
}
```

### 4. InventoryOverview
Location: `frontend/src/components/supplier/InventoryOverview.tsx`

Purpose: Displays inventory status and alerts.

Features:
- Stock level monitoring
- Low stock alerts
- Reorder suggestions
- Product status tracking

## Common Features
All components include:
- TypeScript type safety
- Loading states with skeleton UI
- Error handling
- Responsive design
- Data fetching with error boundaries
- Consistent styling using Tailwind CSS

## Usage Example
```typescript
import { OrderManagement } from '@/components/supplier/OrderManagement';
import { SalesAnalytics } from '@/components/supplier/SalesAnalytics';
import { CustomerInsights } from '@/components/supplier/CustomerInsights';
import { InventoryOverview } from '@/components/supplier/InventoryOverview';

export default function SupplierDashboard() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <OrderManagement />
      <SalesAnalytics />
      <CustomerInsights />
      <InventoryOverview />
    </div>
  );
}
```

## API Integration
Each component fetches data from corresponding API endpoints:
- OrderManagement: `/api/supplier/orders`
- SalesAnalytics: `/api/supplier/analytics/sales`
- CustomerInsights: `/api/supplier/analytics/customers`
- InventoryOverview: `/api/supplier/inventory`

## Testing
All components have corresponding test files:
- `OrderManagement.test.tsx`
- `SalesAnalytics.test.tsx`
- `CustomerInsights.test.tsx`
- `InventoryOverview.test.tsx`

Run tests with:
```bash
npm test components/supplier
```

## Styling
Components use Tailwind CSS with consistent color schemes:
- Primary actions: blue-600
- Success states: green-500
- Warning states: yellow-500
- Error states: red-500
- Neutral states: gray-500

## Error Handling
All components implement error boundaries and display appropriate error messages:
```typescript
try {
  // Component logic
} catch (error) {
  return <ErrorDisplay error={error} component="ComponentName" />;
}
```

## Changelog
- 2025-01-11: Initial documentation
- 2025-01-11: Added component API documentation
- 2025-01-11: Added testing instructions 