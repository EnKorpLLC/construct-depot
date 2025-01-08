'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SupplierApplicationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not logged in
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const applicationData = {
      companyDetails: formData.get('companyDetails'),
      businessType: formData.get('businessType'),
      taxId: formData.get('taxId'),
      websiteUrl: formData.get('websiteUrl'),
      phoneNumber: formData.get('phoneNumber'),
      address: formData.get('address'),
    };

    try {
      const response = await fetch('/api/supplier/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Application submission failed');
      }

      // Redirect to confirmation page
      router.push('/supplier/apply/confirmation');
    } catch (error) {
      console.error('Application error:', error);
      setError(error instanceof Error ? error.message : 'Application submission failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">
              Supplier Application
            </h1>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="companyDetails"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Company Details
                </label>
                <textarea
                  id="companyDetails"
                  name="companyDetails"
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Tell us about your company, products, and experience..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="Business Type"
                  id="businessType"
                  name="businessType"
                  type="text"
                  placeholder="e.g., Manufacturer, Distributor"
                  required
                  fullWidth
                />

                <Input
                  label="Tax ID / EIN"
                  id="taxId"
                  name="taxId"
                  type="text"
                  required
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="Website URL"
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  placeholder="https://"
                  fullWidth
                />

                <Input
                  label="Phone Number"
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  fullWidth
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Business Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required
                />
              </div>

              <div className="bg-gray-50 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6">
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                  >
                    Submit Application
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 