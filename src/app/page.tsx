'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-primary py-16 sm:py-24">
        <div className="relative">
          <div className="text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              Bulk Building Materials
              <span className="block text-secondary">Made Simple</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
              Join our bulk buying club to access wholesale prices on construction materials.
              Pool your orders with other buyers and save big on your next project.
            </p>
            <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
              <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                <Link
                  href="/products"
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-secondary-dark sm:px-8"
                >
                  Browse Products
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary bg-white hover:bg-gray-50 sm:px-8"
                >
                  Join Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
              Why Choose Our Bulk Buying Platform?
            </h2>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-secondary text-2xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-primary mb-2">Save on Bulk Orders</h3>
                <p className="text-gray-600">
                  Pool your orders with other buyers to reach minimum order quantities and access wholesale prices.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-secondary text-2xl mb-4">🚚</div>
                <h3 className="text-xl font-bold text-primary mb-2">Simplified Logistics</h3>
                <p className="text-gray-600">
                  We handle the shipping, storage, and delivery coordination for all bulk orders.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-secondary text-2xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-primary mb-2">Take-off Service</h3>
                <p className="text-gray-600">
                  Submit your blueprints and get accurate material quantities and pricing instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-secondary">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to start saving?
              <span className="block text-primary-dark">Join our bulk buying club today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-secondary bg-white hover:bg-gray-50"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
