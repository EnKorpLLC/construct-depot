import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { OrderMetrics } from '@/components/analytics/OrderMetrics';
import { PoolMetrics } from '@/components/analytics/PoolMetrics';
import { CustomerMetrics } from '@/components/analytics/CustomerMetrics';
import { RevenueMetrics } from '@/components/analytics/RevenueMetrics';
import { theme } from '@/lib/theme';

export default async function AnalyticsDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Volume Metrics */}
          <div className="bg-white rounded-lg shadow p-6" style={{ borderTop: `4px solid ${theme.colors.blueDarker}` }}>
            <OrderMetrics />
          </div>

          {/* Pool Completion Metrics */}
          <div className="bg-white rounded-lg shadow p-6" style={{ borderTop: `4px solid ${theme.colors.orangeDarker}` }}>
            <PoolMetrics />
          </div>

          {/* Revenue & Order Value Metrics */}
          <div className="bg-white rounded-lg shadow p-6" style={{ borderTop: `4px solid ${theme.colors.blueLighter}` }}>
            <RevenueMetrics />
          </div>

          {/* Customer Behavior Metrics */}
          <div className="bg-white rounded-lg shadow p-6" style={{ borderTop: `4px solid ${theme.colors.orangeLighter}` }}>
            <CustomerMetrics />
          </div>
        </div>
      </div>
    </div>
  );
} 