'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Filter, SortAsc, SortDesc } from 'lucide-react';
import { toast } from 'sonner';

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
}

interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  children: Category[];
  products: Product[];
}

export default function CategoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState(searchParams.get('sort') || 'name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('order') as 'asc' | 'desc') || 'asc'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  });

  useEffect(() => {
    fetchCategory();
  }, [params.id]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(
        `/api/categories/${params.id}?includeProducts=true`
      );
      const data = await response.json();
      setCategory(data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load category');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUrl = (newParams: Record<string, string>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
    });
    router.push(`/categories/${params.id}?${current.toString()}`);
  };

  const handleSort = (field: string) => {
    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    updateUrl({ sort: field, order: newOrder });
  };

  const handlePriceFilter = () => {
    updateUrl({
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
    });
  };

  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'name':
        default:
          comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const filterProducts = (products: Product[]) => {
    return products.filter((product) => {
      if (priceRange.min && product.price < parseFloat(priceRange.min)) {
        return false;
      }
      if (priceRange.max && product.price > parseFloat(priceRange.max)) {
        return false;
      }
      return true;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-darker"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category not found</h1>
          <Link
            href="/categories"
            className="text-blue-600 hover:text-blue-800"
          >
            Browse all categories
          </Link>
        </div>
      </div>
    );
  }

  const filteredProducts = filterProducts(sortProducts(category.products));

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 mb-8 text-sm">
        <Link href="/categories" className="hover:text-blue-600">
          Categories
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium">{category.name}</span>
      </div>

      {/* Category Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {category.imageUrl && (
            <Image
              src={category.imageUrl}
              alt={category.name}
              width={120}
              height={120}
              className="rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{category.name}</h1>
            {category.description && (
              <p className="text-grey-lighter mt-2">{category.description}</p>
            )}
          </div>
        </div>

        {category.children.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-medium mb-2">Subcategories</h2>
            <div className="flex flex-wrap gap-2">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/categories/${child.id}`}
                  className="px-4 py-2 bg-grey-lighter/10 rounded-full hover:bg-grey-lighter/20"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border rounded hover:bg-grey-lighter/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSort('name')}
              className={`flex items-center px-4 py-2 border rounded hover:bg-grey-lighter/10 ${
                sortField === 'name' ? 'bg-grey-lighter/10' : ''
              }`}
            >
              Name
              {sortField === 'name' && (
                sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4 ml-2" />
                ) : (
                  <SortDesc className="w-4 h-4 ml-2" />
                )
              )}
            </button>
            
            <button
              onClick={() => handleSort('price')}
              className={`flex items-center px-4 py-2 border rounded hover:bg-grey-lighter/10 ${
                sortField === 'price' ? 'bg-grey-lighter/10' : ''
              }`}
            >
              Price
              {sortField === 'price' && (
                sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4 ml-2" />
                ) : (
                  <SortDesc className="w-4 h-4 ml-2" />
                )
              )}
            </button>
          </div>
        </div>

        <div className="text-sm text-grey-lighter">
          {filteredProducts.length} products
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-medium mb-4">Filters</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, min: e.target.value })
                  }
                  className="w-24 p-2 border rounded"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: e.target.value })
                  }
                  className="w-24 p-2 border rounded"
                />
                <button
                  onClick={handlePriceFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
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

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-grey-lighter">No products found</p>
        </div>
      )}
    </div>
  );
} 