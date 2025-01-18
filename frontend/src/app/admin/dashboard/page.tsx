'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CrawlerManagementWidget } from '@/components/admin/super/CrawlerManagementWidget';
import { SystemMetricsWidget } from '@/components/admin/super/SystemMetricsWidget';
import { UserManagementWidget } from '@/components/admin/super/UserManagementWidget';
import { AdminRole } from '@/types/admin';

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 p-6 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user) {
    return null;
  }

  const handleCreateUser = () => {
    router.push('/admin/users/new');
  };

  const handleEditUser = (userId: string) => {
    router.push(`/admin/users/${userId}/edit`);
  };

  const handleDeleteUser = async (userId: string) => {
    // Refresh the page after successful deletion
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Admin Dashboard
          </h1>

          <div className="space-y-6">
            {/* System Metrics */}
            <div className="bg-white rounded-lg shadow">
              <SystemMetricsWidget />
            </div>

            {/* User Management */}
            <div className="bg-white rounded-lg shadow">
              <UserManagementWidget
                onCreateUser={handleCreateUser}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
              />
            </div>

            {/* Crawler Management (Only visible to SUPER_ADMIN) */}
            {session.user.role === 'SUPER_ADMIN' && (
              <div className="bg-white rounded-lg shadow">
                <CrawlerManagementWidget />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 