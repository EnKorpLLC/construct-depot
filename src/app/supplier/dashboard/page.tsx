'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Package,
  BarChart3,
  ShoppingCart,
  Truck,
  Upload,
  Tag,
  AlertTriangle,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export default function SupplierDashboard() {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: session } = useSession();

  const menuItems: MenuItem[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'products', label: 'Products', icon: <Package className="w-5 h-5" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'inventory', label: 'Inventory', icon: <Truck className="w-5 h-5" /> },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Active Products</h3>
              <div className="text-3xl font-bold text-blue-darker">24</div>
              <p className="text-grey-lighter mt-2">+3 new this month</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Pending Orders</h3>
              <div className="text-3xl font-bold text-orange-600">12</div>
              <p className="text-grey-lighter mt-2">4 require attention</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Low Stock Alerts</h3>
              <div className="text-3xl font-bold text-red-600">5</div>
              <p className="text-grey-lighter mt-2">Items need restock</p>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-lighter h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg w-64"
                  />
                </div>
                <button className="flex items-center px-4 py-2 bg-grey-lighter/10 rounded-lg hover:bg-grey-lighter/20">
                  <Filter className="h-5 w-5 mr-2" />
                  Filter
                </button>
              </div>
              <div className="flex space-x-4">
                <Link
                  href="/supplier/products/bulk-upload"
                  className="flex items-center px-4 py-2 bg-blue-darker text-white rounded-lg hover:bg-blue-lighter"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Bulk Upload
                </Link>
                <Link
                  href="/supplier/products/new"
                  className="flex items-center px-4 py-2 bg-blue-darker text-white rounded-lg hover:bg-blue-lighter"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Product
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-grey-lighter">
                <thead className="bg-grey-lighter/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-lighter uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-lighter uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-lighter uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-lighter uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-grey-lighter uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-grey-lighter uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-grey-lighter">
                  {/* Sample product row */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src="/sample-product.jpg"
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-grey-darker">Premium Lumber</div>
                          <div className="text-sm text-grey-lighter">SKU: LUM-001</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                        Building Materials
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-grey-darker">$299.99</div>
                      <div className="text-sm text-grey-lighter">Per unit</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-grey-darker">150</div>
                      <div className="text-sm text-grey-lighter">units</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                        In Stock
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href="/supplier/products/1/edit" className="text-blue-darker hover:text-blue-lighter">
                        Edit
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            {/* Add orders content */}
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Inventory Alerts</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <div className="font-medium text-red-800">Low Stock Alert</div>
                      <div className="text-sm text-red-600">Premium Lumber - Only 5 units remaining</div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Restock
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-grey-lighter/10">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-grey-darker">Supplier Portal</h1>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left
                ${activeMenu === item.id
                  ? 'bg-blue-lighter/10 border-r-4 border-blue-darker text-blue-darker'
                  : 'text-grey-lighter hover:bg-grey-lighter/10'
                }`}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-grey-darker">
              {menuItems.find((item) => item.id === activeMenu)?.label}
            </h1>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
} 