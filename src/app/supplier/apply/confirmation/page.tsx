'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function SupplierApplicationConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Application Submitted!
          </h2>

          <p className="text-gray-600 mb-8">
            Thank you for applying to become a supplier. Our team will review your
            application and get back to you within 2-3 business days.
          </p>

          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              What happens next?
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Our team will review your application</li>
              <li>• You&apos;ll receive an email with our decision</li>
              <li>• If approved, you can start listing your products</li>
            </ul>
          </div>

          <div className="mt-8">
            <Link href="/">
              <Button fullWidth>
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 