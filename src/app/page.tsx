'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@prisma/client';
import { AuthButtons } from '@/components/AuthButtons';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      switch (session.user.role) {
        case Role.super_admin:
          router.push('/admin/settings/services');
          break;
        case Role.GENERAL_CONTRACTOR:
          router.push('/contractor/dashboard');
          break;
        case Role.SUBCONTRACTOR:
          router.push('/subcontractor/dashboard');
          break;
        case Role.SUPPLIER:
          router.push('/customer/dashboard');
          break;
      }
    }
  }, [session, status, router]);

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-8">
          Welcome to Construct Depot
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
          Your one-stop platform for construction material bulk buying. Save money and time by joining purchase pools.
        </p>
        <AuthButtons />
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Construct Depot?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Bulk Purchase Pools',
                description: 'Join forces with other buyers to access wholesale prices on construction materials.',
              },
              {
                title: 'Verified Suppliers',
                description: 'Work with our network of trusted and verified material suppliers.',
              },
              {
                title: 'Easy Management',
                description: 'Track orders, manage deliveries, and coordinate with pool participants effortlessly.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">
            Ready to Start Saving?
          </h2>
          <p className="mt-6 text-xl text-gray-300">
            Join Construct Depot today and transform how you purchase construction materials.
          </p>
          <AuthButtons variant="secondary" />
        </div>
      </div>
    </div>
  );
} 