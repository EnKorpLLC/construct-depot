'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const PRODUCT_CATEGORIES = [
  'Roofing',
  'Lumber',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Flooring',
  'Windows & Doors',
  'Paint & Supplies',
  'Tools',
  'Hardware',
  'Lighting',
  'Building Materials',
] as const;

const UNITS = [
  'pieces',
  'pallets',
  'cubic yards',
  'square feet',
  'linear feet',
  'gallons',
  'pounds',
  'tons',
] as const;

export default function NewProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Redirect if not supplier
  if (status === 'unauthenticated' || (session?.user?.role !== 'SUPPLIER')) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price') as string),
      minOrderQuantity: parseInt(formData.get('minOrderQuantity') as string),
      unit: formData.get('unit'),
      categories: selectedCategories,
      specifications: {}, // Will be enhanced later
      markup: parseFloat(formData.get('markup') as string) || 1.2,
    };

    try {
      const response = await fetch('/api/supplier/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      router.push('/supplier/products');
    } catch (error) {
      console.error('Product creation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Add New Product
            </h1>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-4 py-5 space-y-6 sm:p-6">
            <Input
              label="Product Name"
              id="name"
              name="name"
              type="text"
              required
              fullWidth
            />

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-gray-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Price"
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                fullWidth
              />

              <Input
                label="Markup (%)"
                id="markup"
                name="markup"
                type="number"
                step="0.01"
                min="1"
                placeholder="1.20 = 20% markup"
                defaultValue="1.20"
                required
                fullWidth
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Minimum Order Quantity"
                id="minOrderQuantity"
                name="minOrderQuantity"
                type="number"
                min="1"
                required
                fullWidth
              />

              <div>
                <label
                  htmlFor="unit"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Unit
                </label>
                <select
                  id="unit"
                  name="unit"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required
                >
                  <option value="">Select a unit</option>
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {PRODUCT_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      selectedCategories.includes(category)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-5 border-t border-gray-200">
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
                  Create Product
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 