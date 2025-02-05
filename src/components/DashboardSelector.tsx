'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { menuItems } from '@/lib/navigation';

interface DashboardSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSelector({ isOpen, onClose }: DashboardSelectorProps) {
  const router = useRouter();
  const { data: session } = useSession();

  if (!isOpen || session?.user?.role !== Role.super_admin) return null;

  const dashboards = [
    { name: 'Super Admin Dashboard', path: '/admin/super', role: Role.super_admin },
    { name: 'Admin Dashboard', path: '/admin/dashboard', role: Role.admin },
    { name: 'Supplier Dashboard', path: '/supplier/dashboard', role: Role.supplier },
    { name: 'Contractor Dashboard', path: '/contractor/dashboard', role: Role.general_contractor },
    { name: 'Subcontractor Dashboard', path: '/subcontractor/dashboard', role: Role.subcontractor },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Select Dashboard View</h2>
        <div className="space-y-4">
          {dashboards.map((dashboard) => {
            const dashboardMenuItems = menuItems[dashboard.role.toLowerCase()];
            if (!dashboardMenuItems) return null;

            return (
              <button
                key={dashboard.path}
                onClick={() => {
                  router.push(dashboard.path);
                  onClose();
                }}
                className="w-full p-4 text-left hover:bg-grey-lighter/10 rounded-lg border border-grey-lighter transition-colors"
              >
                <div className="font-semibold">{dashboard.name}</div>
                <div className="text-sm text-grey-lighter mt-1">
                  Available sections: {dashboardMenuItems.map(item => item.label).join(', ')}
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-darker text-white py-2 rounded-lg hover:bg-blue-lighter transition-colors"
        >
          Close
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
        className="fixed bottom-4 right-4 bg-blue-darker text-white px-4 py-2 rounded-lg hover:bg-blue-lighter transition-colors shadow-lg"
      >
        Switch Dashboard View
      </button>
      <DashboardSelector isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
} 