'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  children: Category[];
  _count: {
    products: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategory = (category: Category) => (
    <Link
      key={category.id}
      href={`/categories/${category.id}`}
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="relative aspect-video">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-grey-lighter/10 flex items-center justify-center">
            <span className="text-grey-lighter">{category.name}</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h2 className="font-medium mb-1">{category.name}</h2>
        {category.description && (
          <p className="text-sm text-grey-lighter mb-2 line-clamp-2">
            {category.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-grey-lighter">
            {category._count.products} products
          </span>
          {category.children.length > 0 && (
            <span className="text-grey-lighter">
              {category.children.length} subcategories
            </span>
          )}
        </div>
      </div>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-darker"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center space-x-2 mb-8">
        <h1 className="text-2xl font-bold">Categories</h1>
        <span className="text-sm text-grey-lighter">
          ({categories.length} categories)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((category) => renderCategory(category))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-grey-lighter">No categories found</p>
        </div>
      )}
    </div>
  );
} 