import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ProjectManagementWidget from '@/components/contractor/ProjectManagementWidget';
import BiddingWidget from '@/components/contractor/BiddingWidget';
import SubcontractorManagementWidget from '@/components/contractor/SubcontractorManagementWidget';
import MaterialOrdersWidget from '@/components/contractor/MaterialOrdersWidget';
import CostAnalyticsWidget from '@/components/contractor/CostAnalyticsWidget';
import BusinessDevelopmentWidget from '@/components/contractor/BusinessDevelopmentWidget';

export default async function ContractorDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'GENERAL_CONTRACTOR') {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            General Contractor Dashboard
          </h1>
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              New Project
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Create Bid
            </button>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Management Section */}
          <div className="lg:col-span-2">
            <ProjectManagementWidget />
          </div>

          {/* Bidding Section */}
          <div className="lg:col-span-1">
            <BiddingWidget />
          </div>

          {/* Subcontractor Management */}
          <div className="lg:col-span-1">
            <SubcontractorManagementWidget />
          </div>

          {/* Material Orders & Tracking */}
          <div className="lg:col-span-1">
            <MaterialOrdersWidget />
          </div>

          {/* Cost Analytics */}
          <div className="lg:col-span-1">
            <CostAnalyticsWidget />
          </div>

          {/* Business Development */}
          <div className="lg:col-span-2">
            <BusinessDevelopmentWidget />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 