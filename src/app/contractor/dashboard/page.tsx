'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';
import { Briefcase, ClipboardList, Users } from 'lucide-react';

type MenuItem = 'overview' | 'projects' | 'orders' | 'subcontractors';

export default function ContractorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItem>('overview');

  // Protect the route
  useEffect(() => {
    if (session?.user?.role !== Role.GENERAL_CONTRACTOR && session?.user?.role !== Role.super_admin) {
      router.push('/auth/login');
    }
  }, [session, router]);

  if (!session || (session.user.role !== Role.GENERAL_CONTRACTOR && session.user.role !== Role.super_admin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grey-lighter/10">
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
                <h3 className="text-lg font-medium text-grey-darker">Active Projects</h3>
                <p className="text-3xl font-bold text-blue-600">5</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-grey-darker">Pending Orders</h3>
                <p className="text-3xl font-bold text-blue-600">3</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-grey-darker">Total Spend</h3>
                <p className="text-3xl font-bold text-blue-600">$45,678</p>
              </div>
            </div>
          </div>
        );
      case 'projects':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Project Management</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="px-4 py-2 border rounded-lg"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    New Project
                  </button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Project Name</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Budget</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Downtown Office Complex</td>
                      <td className="py-2">In Progress</td>
                      <td className="py-2">$1.2M</td>
                      <td className="py-2">
                        <button className="text-blue-600">View</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Material Orders</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    placeholder="Search orders..."
                    className="px-4 py-2 border rounded-lg"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Place Order
                  </button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Order ID</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Total</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">#12345</td>
                      <td className="py-2">Processing</td>
                      <td className="py-2">$5,678</td>
                      <td className="py-2">
                        <button className="text-blue-600">View</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'subcontractors':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Subcontractor Management</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    placeholder="Search subcontractors..."
                    className="px-4 py-2 border rounded-lg"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Add Subcontractor
                  </button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Specialty</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">ABC Plumbing</td>
                      <td className="py-2">Plumbing</td>
                      <td className="py-2">Active</td>
                      <td className="py-2">
                        <button className="text-blue-600">View</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-grey-lighter/10 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-grey-darker">Contractor Dashboard</h1>
        </div>
        <nav className="space-y-1">
          <button
            onClick={() => setActiveMenuItem('overview')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'overview'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-grey-lighter hover:bg-grey-lighter/10'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveMenuItem('projects')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'projects'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-grey-lighter hover:bg-grey-lighter/10'
            }`}
          >
            <Briefcase className="mr-3 h-5 w-5" />
            Projects
          </button>
          <button
            onClick={() => setActiveMenuItem('orders')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'orders'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-grey-lighter hover:bg-grey-lighter/10'
            }`}
          >
            <ClipboardList className="mr-3 h-5 w-5" />
            Orders
          </button>
          <button
            onClick={() => setActiveMenuItem('subcontractors')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'subcontractors'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-grey-lighter hover:bg-grey-lighter/10'
            }`}
          >
            <Users className="mr-3 h-5 w-5" />
            Subcontractors
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {renderContent()}
      </div>
    </div>
  );
} 