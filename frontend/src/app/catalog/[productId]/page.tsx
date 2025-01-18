'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Product } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface ProductWithSupplier extends Product {
  supplier: {
    name: string;
    company: string | null;
  };
}

export default function ProductDetailsPage({ params }: { params: { productId: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [product, setProduct] = useState<ProductWithSupplier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [params.productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/catalog/${params.productId}`);
      if (!response.ok) throw new Error('Failed to fetch product details');
      
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (value: string) => {
    const newQuantity = parseInt(value);
    if (isNaN(newQuantity) || newQuantity < 1) return;
    setQuantity(newQuantity);
  };

  const handleAddToCart = async () => {
    if (!session || !product) return;

    try {
      setAddingToCart(true);
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');
      
      // Show success message or redirect to cart
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Product not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          {product.images && product.images.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {product.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square relative">
                      <img
                        src={image}
                        alt={`${product.name} - Image ${index + 1}`}
                        className="object-cover w-full h-full rounded-lg"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          ) : (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No images available</p>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-gray-600 mb-6">{product.description}</p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-semibold">Price:</span>
                  <span>${product.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Minimum Order Quantity:</span>
                  <span>{product.minOrderQuantity} {product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Supplier:</span>
                  <span>{product.supplier.company || product.supplier.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Section */}
          <Card>
            <CardHeader>
              <CardTitle>Place Order</CardTitle>
              <CardDescription>
                Enter quantity and add to cart
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-32"
                  />
                  <span>{product.unit}</span>
                </div>
                <Button
                  onClick={handleAddToCart}
                  disabled={addingToCart || quantity < product.minOrderQuantity}
                  className="w-full"
                >
                  {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                </Button>
                {quantity < product.minOrderQuantity && (
                  <p className="text-sm text-red-500">
                    Quantity must be at least {product.minOrderQuantity} {product.unit}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 