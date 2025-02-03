'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

interface ProductVariant {
  id?: string;
  sku?: string;
  price: number;
  inventory: number;
  options: {
    name: string;
    value: string;
  }[];
}

interface ProductFormProps {
  initialData?: {
    id?: string;
    name: string;
    description?: string;
    price: number;
    basePrice?: number;
    minOrderQuantity: number;
    categoryId?: string;
    specifications?: Record<string, any>;
    images: { id: string; url: string; alt?: string }[];
    thumbnailUrl?: string;
    hasVariants?: boolean;
    variants?: ProductVariant[];
  };
  onSubmit: (data: FormData) => Promise<void>;
  categories: { id: string; name: string }[];
}

export function ProductForm({ initialData, onSubmit, categories }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState(initialData?.images || []);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(
    Object.entries(initialData?.specifications || {}).map(([key, value]) => ({ key, value: String(value) }))
  );
  const [hasVariants, setHasVariants] = useState(initialData?.hasVariants || false);
  const [variants, setVariants] = useState<ProductVariant[]>(initialData?.variants || []);

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'product');
    formData.append('id', initialData?.id || 'temp');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();
      setImages([...images, { id: Date.now().toString(), url, alt: file.name }]);
      return url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleImageRemove = async (index: number) => {
    const image = images[index];
    try {
      if (image.url) {
        await fetch(`/api/upload?path=${encodeURIComponent(image.url)}`, {
          method: 'DELETE',
        });
      }
      setImages(images.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove image');
    }
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        price: initialData?.basePrice || initialData?.price || 0,
        inventory: 0,
        options: [],
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addVariantOption = (variantIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].options.push({ name: '', value: '' });
    setVariants(newVariants);
  };

  const removeVariantOption = (variantIndex: number, optionIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].options = newVariants[variantIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    setVariants(newVariants);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const updateVariantOption = (
    variantIndex: number,
    optionIndex: number,
    field: 'name' | 'value',
    value: string
  ) => {
    const newVariants = [...variants];
    newVariants[variantIndex].options[optionIndex][field] = value;
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Add specifications
      const specifications = specs.reduce((acc, { key, value }) => {
        if (key && value) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      formData.append('specifications', JSON.stringify(specifications));
      
      // Add images
      formData.append('images', JSON.stringify(images));
      
      // Set thumbnail if not set
      if (!formData.get('thumbnailUrl') && images.length > 0) {
        formData.set('thumbnailUrl', images[0].url);
      }

      // Add variants
      formData.append('hasVariants', String(hasVariants));
      if (hasVariants) {
        formData.append('variants', JSON.stringify(variants));
      }

      await onSubmit(formData);
      toast.success('Product saved successfully');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  const addSpecification = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const removeSpecification = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              defaultValue={initialData?.name}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="categoryId"
              defaultValue={initialData?.categoryId}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            defaultValue={initialData?.description}
            rows={4}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {hasVariants ? 'Base Price' : 'Price'}
            </label>
            <input
              type="number"
              name={hasVariants ? 'basePrice' : 'price'}
              defaultValue={hasVariants ? initialData?.basePrice : initialData?.price}
              required
              min="0"
              step="0.01"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Minimum Order Quantity</label>
            <input
              type="number"
              name="minOrderQuantity"
              defaultValue={initialData?.minOrderQuantity || 1}
              required
              min="1"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasVariants"
            checked={hasVariants}
            onChange={(e) => setHasVariants(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="hasVariants" className="text-sm font-medium">
            This product has variants (size, color, etc.)
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Images</h3>
        <div className="grid grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={image.id} className="relative">
              <ImageUpload
                value={image.url}
                onUpload={() => {}}
                onRemove={() => handleImageRemove(index)}
                className="h-40"
              />
              <input
                type="text"
                placeholder="Alt text"
                value={image.alt || ''}
                onChange={(e) => {
                  const newImages = [...images];
                  newImages[index].alt = e.target.value;
                  setImages(newImages);
                }}
                className="mt-1 w-full p-1 text-sm border rounded"
              />
            </div>
          ))}
          <div className="h-40">
            <ImageUpload
              onUpload={handleImageUpload}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Variants */}
      {hasVariants && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Variants</h3>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Variant
            </button>
          </div>
          
          <div className="space-y-4">
            {variants.map((variant, variantIndex) => (
              <div key={variantIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="grid grid-cols-3 gap-4 flex-1">
                    <div>
                      <label className="block text-sm font-medium mb-1">SKU</label>
                      <input
                        type="text"
                        value={variant.sku || ''}
                        onChange={(e) => updateVariant(variantIndex, 'sku', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Price</label>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => updateVariant(variantIndex, 'price', parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Inventory</label>
                      <input
                        type="number"
                        value={variant.inventory}
                        onChange={(e) => updateVariant(variantIndex, 'inventory', parseInt(e.target.value))}
                        min="0"
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(variantIndex)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Options</h4>
                    <button
                      type="button"
                      onClick={() => addVariantOption(variantIndex)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Add Option
                    </button>
                  </div>
                  
                  {variant.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex gap-4 items-start">
                      <input
                        type="text"
                        placeholder="Name (e.g., Size)"
                        value={option.name}
                        onChange={(e) =>
                          updateVariantOption(variantIndex, optionIndex, 'name', e.target.value)
                        }
                        className="flex-1 p-2 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g., Large)"
                        value={option.value}
                        onChange={(e) =>
                          updateVariantOption(variantIndex, optionIndex, 'value', e.target.value)
                        }
                        className="flex-1 p-2 border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariantOption(variantIndex, optionIndex)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specifications */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Specifications</h3>
          <button
            type="button"
            onClick={addSpecification}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Specification
          </button>
        </div>
        
        <div className="space-y-2">
          {specs.map((spec, index) => (
            <div key={index} className="flex gap-4 items-start">
              <input
                type="text"
                placeholder="Name"
                value={spec.key}
                onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Value"
                value={spec.value}
                onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <button
                type="button"
                onClick={() => removeSpecification(index)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
} 