import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { InventoryOverview } from '@/components/supplier/InventoryOverview';
import { OrderManagement } from '@/components/supplier/OrderManagement';
import { SalesAnalytics } from '@/components/supplier/SalesAnalytics';
import { CustomerInsights } from '@/components/supplier/CustomerInsights';
import { theme } from '@/lib/theme';

export default async function SupplierDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Supplier Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inventory Overview Section */}
          <div className="bg-white rounded-lg shadow p-6" style={{ borderTop: `4px solid ${theme.colors.blueDarker}` }}>
            <InventoryOverview />
          </div>

          {/* Order Management Section */}
          <div className="bg-white rounded-lg shadow p-6" style={{ borderTop: `4px solid ${theme.colors.orangeDarker}` }}>
            <OrderManagement />
          </div>

          {/* Sales Analytics Section */}
          <div className="bg-white rounded-lg shadow p-6" style={{ borderTop: `4px solid ${theme.colors.blueLighter}` }}>
            <SalesAnalytics />
          </div>

          {/* Customer Insights Section */}
          <div className="bg-white rounded-lg shadow p-6" style={{ borderTop: `4px solid ${theme.colors.orangeLighter}` }}>
            <CustomerInsights />
          </div>
        </div>
      </div>
    </div>
  );
} 