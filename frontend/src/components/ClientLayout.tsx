'use client';

import Navigation from './Navigation';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        {children}
      </main>
      <footer className="mt-auto border-t bg-white py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} Bulk Buyer Group. All rights reserved.
        </div>
      </footer>
    </div>
  );
} 