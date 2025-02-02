'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';
import { Briefcase, ClipboardList, DollarSign, Wrench } from 'lucide-react';

type MenuItem = 'overview' | 'jobs' | 'bids' | 'materials';

export default function SubcontractorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItem>('overview');

  // Protect the route
  useEffect(() => {
    if (session?.user?.role !== Role.SUBCONTRACTOR && session?.user?.role !== Role.super_admin) {
      router.push('/auth/login');
    }
  }, [session, router]);

  if (!session || (session.user.role !== Role.SUBCONTRACTOR && session.user.role !== Role.super_admin)) {
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
                <h3 className="text-lg font-medium text-gray-900">Active Jobs</h3>
                <p className="text-3xl font-bold text-blue-600">3</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Open Bids</h3>
                <p className="text-3xl font-bold text-blue-600">7</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Earnings</h3>
                <p className="text-3xl font-bold text-blue-600">$34,567</p>
              </div>
            </div>
          </div>
        );
      case 'jobs':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Active Jobs</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    className="px-4 py-2 border rounded-lg"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Update Status
                  </button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Job Name</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Due Date</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Office Building Plumbing</td>
                      <td className="py-2">In Progress</td>
                      <td className="py-2">Dec 31, 2024</td>
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
      case 'bids':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Bid Management</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    placeholder="Search bids..."
                    className="px-4 py-2 border rounded-lg"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Submit New Bid
                  </button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Project</th>
                      <th className="text-left py-2">Bid Amount</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Hospital Renovation</td>
                      <td className="py-2">$75,000</td>
                      <td className="py-2">Pending</td>
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
      case 'materials':
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
                      <th className="text-left py-2">Items</th>
                      <th className="text-left py-2">Total</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">#12345</td>
                      <td className="py-2">Pipes, Fittings</td>
                      <td className="py-2">$2,345</td>
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">Subcontractor Dashboard</h1>
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
            onClick={() => setActiveMenuItem('jobs')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'jobs'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Briefcase className="mr-3 h-5 w-5" />
            Active Jobs
          </button>
          <button
            onClick={() => setActiveMenuItem('bids')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'bids'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="mr-3 h-5 w-5" />
            Bids
          </button>
          <button
            onClick={() => setActiveMenuItem('materials')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'materials'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Wrench className="mr-3 h-5 w-5" />
            Materials
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