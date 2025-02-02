'use client';

import { useState, useEffect } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ProjectOverviewWidget from '@/components/customer/ProjectOverviewWidget';
import BudgetTrackingWidget from '@/components/customer/BudgetTrackingWidget';
import TimelineWidget from '@/components/customer/TimelineWidget';
import CommunicationHubWidget from '@/components/customer/CommunicationHubWidget';
import CustomerDashboardService from '@/services/customer/dashboardService';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';
import { Package, ClipboardList, BarChart2, Box } from 'lucide-react';

type MenuItem = 'overview' | 'products' | 'orders' | 'inventory' | 'analytics';

export default function CustomerDashboard() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItem>('overview');

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        const projects = await CustomerDashboardService.getProjects();
        if (projects.length > 0) {
          setSelectedProjectId(projects[0].id);
        }
        setError(null);
      } catch (err) {
        setError('Failed to initialize dashboard. Please try again later.');
        console.error('Error initializing dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  // Protect the route
  useEffect(() => {
    if (session?.user?.role !== Role.SUPPLIER && session?.user?.role !== Role.super_admin) {
      router.push('/auth/login');
    }
  }, [session, router]);

  if (!session || (session.user.role !== Role.SUPPLIER && session.user.role !== Role.super_admin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-screen">
            <div className="text-red-600">{error}</div>
          </div>
        </div>
      </DashboardLayout>
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
                <h3 className="text-lg font-medium text-gray-900">Active Orders</h3>
                <p className="text-3xl font-bold text-blue-600">12</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Products Listed</h3>
                <p className="text-3xl font-bold text-blue-600">45</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
                <p className="text-3xl font-bold text-blue-600">$78,901</p>
              </div>
            </div>
          </div>
        );
      case 'products':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Product Management</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="px-4 py-2 border rounded-lg"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Add Product
                  </button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Product Name</th>
                      <th className="text-left py-2">Category</th>
                      <th className="text-left py-2">Price</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Premium Lumber</td>
                      <td className="py-2">Wood</td>
                      <td className="py-2">$45/unit</td>
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
      case 'orders':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Order Management</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    placeholder="Search orders..."
                    className="px-4 py-2 border rounded-lg"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Export Orders
                  </button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Order ID</th>
                      <th className="text-left py-2">Customer</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Total</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">#12345</td>
                      <td className="py-2">ABC Construction</td>
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
      case 'inventory':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Inventory Management</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    className="px-4 py-2 border rounded-lg"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Update Stock
                  </button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Product</th>
                      <th className="text-left py-2">In Stock</th>
                      <th className="text-left py-2">Reserved</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Premium Lumber</td>
                      <td className="py-2">500</td>
                      <td className="py-2">50</td>
                      <td className="py-2">
                        <button className="text-blue-600">Adjust</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Sales Trends</h3>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  Chart Placeholder
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Popular Products</h3>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  Chart Placeholder
                </div>
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
          <h1 className="text-xl font-bold text-gray-900">Supplier Dashboard</h1>
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
            onClick={() => setActiveMenuItem('products')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'products'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package className="mr-3 h-5 w-5" />
            Products
          </button>
          <button
            onClick={() => setActiveMenuItem('orders')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'orders'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ClipboardList className="mr-3 h-5 w-5" />
            Orders
          </button>
          <button
            onClick={() => setActiveMenuItem('inventory')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'inventory'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Box className="mr-3 h-5 w-5" />
            Inventory
          </button>
          <button
            onClick={() => setActiveMenuItem('analytics')}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
              activeMenuItem === 'analytics'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart2 className="mr-3 h-5 w-5" />
            Analytics
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