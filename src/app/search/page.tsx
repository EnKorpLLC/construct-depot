'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Filter, Search as SearchIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  thumbnailUrl?: string;
  supplier: {
    id: string;
    name: string;
    company: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  _count: {
    products: number;
  };
}

interface SearchResults {
  products: Product[];
  total: number;
  pages: number;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (filters.query) {
      debouncedSearch();
    }
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Categories fetch error:', error);
    }
  };

  const search = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.query) params.set('q', filters.query);
      if (filters.category) params.set('category', filters.category);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      params.set('page', filters.page.toString());

      const response = await fetch(`/api/products/search?${params.toString()}`);
      const data = await response.json();
      setResults(data);

      // Update URL
      router.push(`/search?${params.toString()}`, { scroll: false });
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search');
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = debounce(search, 300);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1, // Reset page when other filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      ...filters,
      category: '',
      minPrice: '',
      maxPrice: '',
      page: 1,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Search Header */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            placeholder="Search products..."
            className="w-full p-4 pl-12 pr-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-lighter" />
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <div className={`w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">Filters</h2>
              {(filters.category || filters.minPrice || filters.maxPrice) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Category</h3>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category._count.products})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <h3 className="text-sm font-medium mb-2">Price Range</h3>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center mb-4 text-sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-darker"></div>
            </div>
          ) : results?.products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-grey-lighter">No products found</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-grey-lighter">
                {results?.total} products found
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results?.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-square">
                      {product.thumbnailUrl ? (
                        <Image
                          src={product.thumbnailUrl}
                          alt={product.name}
                          fill
                          className="rounded-t-lg object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-grey-lighter/10 rounded-t-lg flex items-center justify-center">
                          <span className="text-grey-lighter">No image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-medium mb-1">{product.name}</h3>
                      {product.category && (
                        <div className="text-sm text-grey-lighter mb-1">
                          in {product.category.name}
                        </div>
                      )}
                      <p className="text-sm text-grey-lighter mb-2">
                        {product.supplier.company}
                      </p>
                      <div className="font-medium text-blue-darker">
                        ${product.price.toFixed(2)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {results && results.pages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  {Array.from({ length: results.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handleFilterChange('page', page)}
                      className={`px-4 py-2 rounded ${
                        filters.page === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-grey-lighter/10 hover:bg-grey-lighter/20'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 