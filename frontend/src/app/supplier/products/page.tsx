'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  minOrderQuantity: number;
  unit: string;
  isActive: boolean;
  categories: string[];
  images: string[];
}

interface PooledOrderProgress {
  currentQuantity: number;
  targetQuantity: number;
  progress: number;
  remainingQuantity: number;
  isComplete: boolean;
}

export default function SupplierProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [pooledOrders, setPooledOrders] = useState<Record<string, PooledOrderProgress>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch products and their pooled orders
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await fetch('/api/supplier/products');
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        const productsData = await productsResponse.json();
        setProducts(productsData);

        // Fetch pooled orders
        const pooledOrdersResponse = await fetch('/api/pooled-orders');
        if (!pooledOrdersResponse.ok) {
          throw new Error('Failed to fetch pooled orders');
        }
        const pooledOrdersData = await pooledOrdersResponse.json();

        // Create a map of product ID to pooled order progress
        const progressMap = pooledOrdersData.reduce((acc: Record<string, PooledOrderProgress>, order: any) => {
          if (order.status === 'OPEN') {
            acc[order.productId] = {
              currentQuantity: order.currentQuantity,
              targetQuantity: order.targetQuantity,
              progress: order.progress,
              remainingQuantity: order.remainingQuantity,
              isComplete: order.isComplete,
            };
          }
          return acc;
        }, {});

        setPooledOrders(progressMap);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchData();
    }
  }, [session]);

  // Handle product activation/deactivation
  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/supplier/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: productId,
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId
            ? { ...product, isActive: !currentStatus }
            : product
        )
      );
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Failed to update product status');
    }
  };

  // Redirect if not supplier
  if (status === 'unauthenticated' || (session?.user?.role !== 'SUPPLIER')) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Product Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your product catalog
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/supplier/products/bulk-upload')}
              >
                Bulk Upload
              </Button>
              <Button
                onClick={() => router.push('/supplier/products/new')}
              >
                Add New Product
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700">
              <p>{error}</p>
            </div>
          )}

          {/* Product List */}
          <div className="px-4 py-5 sm:p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new product.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => router.push('/supplier/products/new')}
                  >
                    Add New Product
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-primary flex flex-col"
                  >
                    <div className="flex-1">
                      {/* Product Images */}
                      {product.images && product.images.length > 0 && (
                        <div className="mb-4">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-48 w-full object-cover rounded-lg"
                          />
                          {product.images.length > 1 && (
                            <div className="mt-2 flex gap-2 overflow-x-auto">
                              {product.images.slice(1).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`${product.name} ${index + 2}`}
                                  className="h-16 w-16 object-cover rounded-lg flex-shrink-0"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          {product.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {product.description}
                      </p>

                      <div className="mt-4 space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Price:</span> ${product.price}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">MOQ:</span> {product.minOrderQuantity} {product.unit}
                        </p>

                        {/* MOQ Progress */}
                        {pooledOrders[product.id] && (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">Order Progress</span>
                              <span>{Math.round(pooledOrders[product.id].progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${pooledOrders[product.id].progress}%` }}
                              />
                            </div>
                            <p className="text-sm mt-1 text-gray-600">
                              {pooledOrders[product.id].remainingQuantity > 0
                                ? `${pooledOrders[product.id].remainingQuantity} ${product.unit} needed to reach MOQ`
                                : 'MOQ reached!'
                              }
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {product.categories.map((category) => (
                            <span
                              key={category}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => router.push(`/supplier/products/${product.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={product.isActive ? "outline" : "primary"}
                        size="sm"
                        fullWidth
                        onClick={() => toggleProductStatus(product.id, product.isActive)}
                      >
                        {product.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 