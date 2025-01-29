'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SupplierApplicationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit application');
      }

      // Redirect to confirmation page
      router.push('/supplier/apply/confirmation');
    } catch (error) {
      console.error('Application error:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Supplier Application
            </h1>
            <p className="mt-2 text-gray-600">
              Join our network of trusted suppliers and reach more customers.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="companyDetails"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company Details
              </label>
              <textarea
                id="companyDetails"
                name="companyDetails"
                rows={4}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Tell us about your company, products, and services..."
              />
            </div>

            <Input
              label="Business Type"
              id="businessType"
              name="businessType"
              type="text"
              required
              placeholder="e.g., Corporation, LLC, Sole Proprietorship"
              fullWidth
            />

            <Input
              label="Tax ID / EIN"
              id="taxId"
              name="taxId"
              type="text"
              required
              placeholder="XX-XXXXXXX"
              fullWidth
            />

            <Input
              label="Website URL"
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              placeholder="https://example.com"
              fullWidth
            />

            <Input
              label="Phone Number"
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              required
              placeholder="(XXX) XXX-XXXX"
              fullWidth
            />

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Business Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Full business address..."
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isLoading}
              >
                Submit Application
              </Button>
            </div>

            <p className="text-sm text-gray-500 text-center">
              By submitting this application, you agree to our{' '}
              <a href="/terms" className="text-primary hover:text-primary-dark">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary hover:text-primary-dark">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        </div>
      </div>
    </div>
  );
} 