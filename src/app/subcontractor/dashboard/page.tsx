import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ProjectOpportunitiesWidget from '@/components/subcontractor/ProjectOpportunitiesWidget';
import ActiveProjectsWidget from '@/components/subcontractor/ActiveProjectsWidget';
import PerformanceAnalyticsWidget from '@/components/subcontractor/PerformanceAnalyticsWidget';
import PaymentTrackingWidget from '@/components/subcontractor/PaymentTrackingWidget';

export default async function SubcontractorDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'SUBCONTRACTOR') {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Subcontractor Dashboard
          </h1>
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Find Projects
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Submit Bid
            </button>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Opportunities Section */}
          <div className="lg:col-span-2">
            <ProjectOpportunitiesWidget />
          </div>

          {/* Active Projects Section */}
          <div className="lg:col-span-2">
            <ActiveProjectsWidget />
          </div>

          {/* Performance Analytics Section */}
          <div className="lg:col-span-1">
            <PerformanceAnalyticsWidget />
          </div>

          {/* Payment Tracking Section */}
          <div className="lg:col-span-1">
            <PaymentTrackingWidget />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 