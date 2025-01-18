import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isSuperAdmin } from '@/types/user';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SystemHealthWidget from '@/components/admin/super/SystemHealthWidget';
import CrawlerManagementWidget from '@/components/admin/super/CrawlerManagementWidget';
import AdminActivityWidget from '@/components/admin/super/AdminActivityWidget';
import GlobalConfigWidget from '@/components/admin/super/GlobalConfigWidget';

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !isSuperAdmin(session.user)) {
    redirect('/login');
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Super Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* System Health Overview */}
          <Suspense fallback={<LoadingSpinner />}>
            <SystemHealthWidget />
          </Suspense>

          {/* Crawler Management */}
          <Suspense fallback={<LoadingSpinner />}>
            <CrawlerManagementWidget />
          </Suspense>

          {/* Admin Activity Log */}
          <Suspense fallback={<LoadingSpinner />}>
            <AdminActivityWidget />
          </Suspense>

          {/* Global Configuration */}
          <Suspense fallback={<LoadingSpinner />}>
            <GlobalConfigWidget />
          </Suspense>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              label="New Crawler Job"
              icon="🤖"
              onClick={() => {/* Handle action */}}
            />
            <QuickActionButton
              label="System Backup"
              icon="💾"
              onClick={() => {/* Handle action */}}
            />
            <QuickActionButton
              label="Security Audit"
              icon="🔒"
              onClick={() => {/* Handle action */}}
            />
            <QuickActionButton
              label="User Management"
              icon="👥"
              onClick={() => {/* Handle action */}}
            />
          </div>
        </div>

        {/* System Notifications */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            System Notifications
          </h2>
          <div className="bg-white rounded-lg shadow p-4">
            <SystemNotificationsList />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function QuickActionButton({ 
  label, 
  icon, 
  onClick 
}: { 
  label: string; 
  icon: string; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
    >
      <span className="text-2xl mr-2">{icon}</span>
      <span className="font-medium text-gray-700">{label}</span>
    </button>
  );
}

function SystemNotificationsList() {
  return (
    <div className="space-y-4">
      <div className="flex items-start p-3 bg-yellow-50 rounded-md">
        <span className="text-yellow-500 mr-3">⚠️</span>
        <div>
          <h3 className="font-medium text-yellow-800">System Update Available</h3>
          <p className="text-sm text-yellow-600">New security patches available for installation</p>
        </div>
      </div>
      <div className="flex items-start p-3 bg-green-50 rounded-md">
        <span className="text-green-500 mr-3">✅</span>
        <div>
          <h3 className="font-medium text-green-800">Backup Completed</h3>
          <p className="text-sm text-green-600">Daily system backup completed successfully</p>
        </div>
      </div>
      <div className="flex items-start p-3 bg-blue-50 rounded-md">
        <span className="text-blue-500 mr-3">ℹ️</span>
        <div>
          <h3 className="font-medium text-blue-800">Crawler Status</h3>
          <p className="text-sm text-blue-600">3 crawler jobs completed in the last hour</p>
        </div>
      </div>
    </div>
  );
} 