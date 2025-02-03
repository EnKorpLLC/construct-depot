'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductForm } from '@/components/products/ProductForm';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: PageProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Fetch product data
        const productResponse = await fetch(`/api/products/${params.id}`);
        const productData = await productResponse.json();
        setProduct(productData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      }
    };

    fetchData();
  }, [params.id]);

  const handleSubmit = async (formData: FormData) => {
    try {
      formData.append('id', params.id);
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      const product = await response.json();
      toast.success('Product updated successfully');
      router.push(`/products/${product.id}`);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to update product');
    }
  };

  if (!categories.length || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Edit Product</h1>
      
      <ProductForm
        initialData={product}
        onSubmit={handleSubmit}
        categories={categories}
      />
    </div>
  );
} 