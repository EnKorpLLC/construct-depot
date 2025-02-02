'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';

export function DashboardSelector({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();

  const dashboards = [
    { name: 'Super Admin Dashboard', path: '/admin/dashboard', role: Role.super_admin },
    { name: 'General Contractor Dashboard', path: '/contractor/dashboard', role: Role.GENERAL_CONTRACTOR },
    { name: 'Subcontractor Dashboard', path: '/subcontractor/dashboard', role: Role.SUBCONTRACTOR },
    { name: 'Supplier Dashboard', path: '/customer/dashboard', role: Role.SUPPLIER },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Select Dashboard</h2>
        <div className="space-y-4">
          {dashboards.map((dashboard) => (
            <button
              key={dashboard.path}
              onClick={() => {
                router.push(dashboard.path);
                onClose();
              }}
              className="w-full p-4 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
            >
              <div className="font-semibold">{dashboard.name}</div>
              <div className="text-sm text-gray-500">View as {dashboard.role}</div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue to Current Dashboard
        </button>
      </div>
    </div>
  );
}

export function DashboardSelectorButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  if (session?.user?.role !== Role.super_admin) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Switch Dashboard View
      </button>
      <DashboardSelector isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
} 