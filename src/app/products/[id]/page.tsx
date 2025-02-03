'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Product, PriceBracket } from '@prisma/client';
import { useSession } from 'next-auth/react';

type ProductWithBrackets = Product & {
  priceBrackets: PriceBracket[];
  supplier: {
    name: string;
  };
};

export default function ProductDetail() {
  const [product, setProduct] = useState<ProductWithBrackets | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const params = useParams();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Product not found</div>
      </div>
    );
  }

  const getCurrentPrice = () => {
    if (!product.priceBrackets || product.priceBrackets.length === 0) {
      return product.price;
    }

    const applicableBracket = product.priceBrackets
      .sort((a, b) => b.minQuantity - a.minQuantity)
      .find(bracket => quantity >= bracket.minQuantity);

    return applicableBracket ? applicableBracket.price : product.price;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="md:flex md:items-start md:space-x-8">
              <div className="md:w-1/2">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                <p className="text-gray-600 mb-6">{product.description}</p>
                
                <div className="border-t border-b py-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="text-xl font-bold text-gray-900">${product.price}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Current Price:</span>
                    <span className="text-xl font-bold text-blue-darker">${getCurrentPrice()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Available Stock:</span>
                    <span className="text-gray-900">{product.inventory} units</span>
                  </div>
                </div>

                {product.priceBrackets && product.priceBrackets.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Volume Discounts</h3>
                    <div className="space-y-2">
                      {product.priceBrackets
                        .sort((a, b) => a.minQuantity - b.minQuantity)
                        .map((bracket) => (
                          <div
                            key={bracket.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{bracket.minQuantity}+ units</span>
                            <span className="font-medium">${bracket.price}/unit</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        min={product.minOrderQuantity}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    {product.minOrderQuantity > 1 && (
                      <p className="mt-1 text-sm text-gray-500">
                        Minimum order quantity: {product.minOrderQuantity} units
                      </p>
                    )}
                  </div>

                  <button
                    className="w-full bg-blue-darker text-white py-2 px-4 rounded-md hover:bg-blue-lighter focus:outline-none focus:ring-2 focus:ring-blue-darker focus:ring-offset-2"
                    onClick={() => {/* Add to cart/pool logic */}}
                  >
                    Add to Order
                  </button>
                </div>
              </div>

              <div className="md:w-1/2 mt-8 md:mt-0">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Supplier Information</h3>
                  <p className="text-gray-600">{product.supplier.name}</p>
                  
                  <h3 className="text-lg font-semibold mt-6 mb-4">Pooling Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Current Pool Progress:</span>
                      <span className="text-gray-900">75%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pool Deadline:</span>
                      <span className="text-gray-900">3 days left</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 