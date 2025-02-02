'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';
import { DashboardSelector, DashboardSelectorButton } from '@/components/DashboardSelector';
import { Users, FileText, Settings, X } from 'lucide-react';

type MenuItem = 'overview' | 'users' | 'reports' | 'settings';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showSelector, setShowSelector] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItem>('overview');
  const [showSettings, setShowSettings] = useState(false);

  // Show dashboard selector on first load for super admin
  useEffect(() => {
    if (session?.user?.role === Role.super_admin) {
      setShowSelector(true);
    }
  }, [session]);

  // Protect the route
  useEffect(() => {
    if (session?.user?.role !== Role.super_admin) {
      router.push('/auth/login');
    }
  }, [session, router]);

  if (!session || session.user.role !== Role.super_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeMenuItem) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
                <p className="text-3xl font-bold text-blue-600">123</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Active Orders</h3>
                <p className="text-3xl font-bold text-blue-600">45</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
                <p className="text-3xl font-bold text-blue-600">$12,345</p>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">User Management</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="px-4 py-2 border rounded-lg"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Add User
                  </button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Role</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">John Doe</td>
                      <td className="py-2">john@example.com</td>
                      <td className="py-2">Contractor</td>
                      <td className="py-2">
                        <button className="text-blue-600">Edit</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">User Growth</h3>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  Chart Placeholder
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Revenue</h3>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  Chart Placeholder
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">System Settings</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Site Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    defaultValue="Construct Depot"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    defaultValue="support@constructdepot.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    API Key
                  </label>
                  <input
                    type="password"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    onClick={() => setShowSettings(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <nav className="space-y-1">
          <button
            onClick={() => setActiveMenuItem('overview')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'overview'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveMenuItem('users')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'users'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="mr-3 h-5 w-5" />
            User Management
          </button>
          <button
            onClick={() => setActiveMenuItem('reports')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'reports'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="mr-3 h-5 w-5" />
            Reports
          </button>
          <button
            onClick={() => setActiveMenuItem('settings')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'settings'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="mr-3 h-5 w-5" />
            System Settings
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {renderContent()}
      </div>

      {/* Dashboard Selector Modal */}
      <DashboardSelector isOpen={showSelector} onClose={() => setShowSelector(false)} />
      
      {/* Dashboard Switch Button */}
      <DashboardSelectorButton />
    </div>
  );
} 