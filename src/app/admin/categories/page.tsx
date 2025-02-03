'use client';

import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from 'sonner';
import { Plus, Edit, Trash, ChevronRight, ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  children: Category[];
  _count: {
    products: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      if (editingCategory) {
        formData.append('id', editingCategory.id);
      }

      const response = await fetch('/api/categories', {
        method,
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to save category');

      toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`/api/categories?id=${category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete category');
      }

      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: Category, level = 0) => (
    <div key={category.id} className="border-b last:border-b-0">
      <div
        className={`flex items-center py-3 px-4 hover:bg-grey-lighter/10 ${
          level > 0 ? 'ml-6' : ''
        }`}
      >
        {category.children.length > 0 && (
          <button
            onClick={() => toggleExpand(category.id)}
            className="p-1 hover:bg-grey-lighter/20 rounded"
          >
            {expandedCategories.has(category.id) ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        
        {category.imageUrl && (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-8 h-8 object-cover rounded mr-3"
          />
        )}
        
        <div className="flex-1">
          <div className="font-medium">{category.name}</div>
          {category.description && (
            <div className="text-sm text-grey-lighter">{category.description}</div>
          )}
        </div>
        
        <div className="text-sm text-grey-lighter mr-4">
          {category._count.products} products
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingCategory(category);
              setIsModalOpen(true);
            }}
            className="p-2 hover:bg-grey-lighter/20 rounded"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(category)}
            className="p-2 hover:bg-grey-lighter/20 rounded text-red-500"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {expandedCategories.has(category.id) && category.children.length > 0 && (
        <div className="border-l ml-4">
          {category.children.map((child) => renderCategory(child, level + 1))}
        </div>
      )}
    </div>
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {categories.map((category) => renderCategory(category))}
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCategory?.name}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingCategory?.description}
                  rows={3}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Parent Category</label>
                <select
                  name="parentId"
                  defaultValue={editingCategory?.parentId || ''}
                  className="w-full p-2 border rounded"
                >
                  <option value="">None</option>
                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                      disabled={category.id === editingCategory?.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                <ImageUpload
                  value={editingCategory?.imageUrl}
                  onUpload={async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('type', 'category');
                    
                    const response = await fetch('/api/upload', {
                      method: 'POST',
                      body: formData,
                    });
                    
                    if (!response.ok) throw new Error('Upload failed');
                    
                    const { url } = await response.json();
                    return url;
                  }}
                  aspectRatio="16:9"
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-grey-lighter/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 