'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Product } from '@prisma/client';
import Link from 'next/link';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const { data: session } = useSession();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price':
        return a.price - b.price;
      case 'inventory':
        return a.inventory - b.inventory;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          {session?.user?.role === 'SUPPLIER' && (
            <Link
              href="/supplier/products/new"
              className="px-4 py-2 bg-blue-darker text-white rounded-lg hover:bg-blue-lighter"
            >
              Add New Product
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border rounded-lg w-full sm:w-64"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="inventory">Sort by Inventory</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="block bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-darker">${product.price}</span>
                      <span className="text-sm text-gray-500">
                        {product.inventory} in stock
                      </span>
                    </div>
                    {product.minOrderQuantity > 1 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Min. Order: {product.minOrderQuantity} units
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 