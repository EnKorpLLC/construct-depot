import React from 'react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-grey-lighter/10">
      <nav className="bg-white border-b border-grey-lighter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-blue-darker hover:text-blue-lighter transition-colors">
                  ConstructDepot
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/customer/dashboard"
                  className="border-blue-darker text-grey-darker inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/customer/orders"
                  className="border-transparent text-grey-lighter hover:border-grey-darker hover:text-grey-darker inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                >
                  Orders
                </Link>
                <Link
                  href="/customer/profile"
                  className="border-transparent text-grey-lighter hover:border-grey-darker hover:text-grey-darker inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                >
                  Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 