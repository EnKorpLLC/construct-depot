'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';

export default function BulkUploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    productsCreated?: number;
    errors?: Array<{
      row: number;
      error: any;
    }>;
  } | null>(null);

  // Redirect if not supplier
  if (status === 'unauthenticated' || (session?.user?.role !== 'SUPPLIER')) {
    router.push('/login');
    return null;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.type !== 'text/csv') {
      setError('Please upload a CSV file');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/supplier/products/bulk', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw result;
      }

      setUploadResult(result);
    } catch (error) {
      console.error('Error uploading products:', error);
      setError('Failed to upload products');
      if (error.errors) {
        setUploadResult(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    window.location.href = '/templates/product_catalog_template.csv';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Bulk Product Upload
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload multiple products at once using a CSV file
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700">
              <p>{error}</p>
            </div>
          )}

          {uploadResult?.success && (
            <div className="px-4 py-3 bg-green-50 border-l-4 border-green-400 text-green-700">
              <p>Successfully uploaded {uploadResult.productsCreated} products!</p>
            </div>
          )}

          {uploadResult?.errors && (
            <div className="px-4 py-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
              <p className="font-medium">Upload completed with errors:</p>
              <ul className="mt-2 list-disc list-inside">
                {uploadResult.errors.map((error, index) => (
                  <li key={index}>
                    Row {error.row}: {JSON.stringify(error.error)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="px-4 py-5 space-y-6 sm:p-6">
            {/* Template Download */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">1. Download Template</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by downloading our CSV template and filling it with your product data
              </p>
              <div className="mt-3">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                >
                  Download Template
                </Button>
              </div>
            </div>

            {/* CSV Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">2. Upload Your CSV</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload your completed CSV file to add multiple products at once
              </p>
              <div className="mt-3">
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                      >
                        <span>Upload CSV file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".csv"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV files only</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">Instructions</h3>
              <div className="mt-2 text-sm text-gray-500 space-y-2">
                <p>1. Download the template CSV file using the button above</p>
                <p>2. Fill in your product data following the template format</p>
                <p>3. Save your file as CSV</p>
                <p>4. Upload your completed CSV file</p>
                <p>5. Review any errors and fix them in your CSV if needed</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/supplier/products')}
              className="mr-3"
            >
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 