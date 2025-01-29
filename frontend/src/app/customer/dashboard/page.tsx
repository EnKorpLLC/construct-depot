import { Suspense } from 'react';
import { OrderList } from '@/components/customer/OrderList';
import { ProjectList } from '@/components/customer/ProjectList';
import { BudgetOverview } from '@/components/customer/BudgetOverview';
import { TimelineView } from '@/components/customer/TimelineView';
import { MessageCenter } from '@/components/customer/MessageCenter';
import { NotificationPanel } from '@/components/customer/NotificationPanel';
import { DashboardStats } from '@/components/customer/DashboardStats';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { CustomerDashboardService } from '@/lib/services/customer/dashboardService';

export default function CustomerDashboard() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <Suspense fallback={<div>Loading stats...</div>}>
          <DashboardStats />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            <Suspense fallback={<div>Loading orders...</div>}>
              <OrderList />
            </Suspense>
          </div>

          {/* Projects Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Active Projects</h2>
            <Suspense fallback={<div>Loading projects...</div>}>
              <ProjectList />
            </Suspense>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Budget Overview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Budget Overview</h2>
            <Suspense fallback={<div>Loading budget...</div>}>
              <BudgetOverview />
            </Suspense>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Timeline</h2>
            <Suspense fallback={<div>Loading timeline...</div>}>
              <TimelineView />
            </Suspense>
          </div>

          {/* Communication Center */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Messages & Notifications</h2>
            <Suspense fallback={<div>Loading messages...</div>}>
              <div className="space-y-6">
                <MessageCenter />
                <NotificationPanel />
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 