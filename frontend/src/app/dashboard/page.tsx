'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

type UserRole = 'CUSTOMER' | 'GENERAL_CONTRACTOR' | 'SUBCONTRACTOR' | 'SUPPLIER';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const userRole = (session.user.role as UserRole) || 'CUSTOMER';
  const userName = session.user.firstName || 'User';

  const roleSpecificActions = {
    ADMIN: [
      { label: 'Review Supplier Applications', href: '/admin/suppliers' },
      { label: 'Manage Users', href: '/admin/users' },
      { label: 'Site Settings', href: '/admin/settings' },
    ],
    SUPPLIER: [
      { label: 'Manage Products', href: '/supplier/products' },
      { label: 'View Orders', href: '/supplier/orders' },
      { label: 'Update Profile', href: '/supplier/profile' },
    ],
    GENERAL_CONTRACTOR: [
      { label: 'Post Jobs', href: '/contractor/jobs/post' },
      { label: 'Manage Projects', href: '/contractor/projects' },
      { label: 'Find Subcontractors', href: '/contractor/subcontractors' },
    ],
    SUBCONTRACTOR: [
      { label: 'Find Jobs', href: '/subcontractor/jobs' },
      { label: 'My Bids', href: '/subcontractor/bids' },
      { label: 'Active Projects', href: '/subcontractor/projects' },
    ],
    CUSTOMER: [
      { label: 'Browse Products', href: '/products' },
      { label: 'My Orders', href: '/orders' },
      { label: 'Saved Items', href: '/saved' },
    ],
  };

  const userActions = roleSpecificActions[userRole] || roleSpecificActions.CUSTOMER;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {userName}!
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {userRole.replace(/_/g, ' ').toLowerCase()} dashboard
            </p>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userActions.map((action) => (
                <Button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  variant="outline"
                  fullWidth
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            <div className="mt-4">
              <p className="text-sm text-gray-500">No recent activity to display.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 