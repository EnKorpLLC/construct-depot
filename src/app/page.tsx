'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Role, Product } from '@prisma/client';
import { AuthButtons } from '@/components/AuthButtons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, ChevronRight, TrendingUp, Users, Package, Truck } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// Sample data - this would come from your database
const featuredCategories = [
  { id: 1, name: 'Building Materials', image: '/categories/building-materials.jpg' },
  { id: 2, name: 'Tools & Equipment', image: '/categories/tools.jpg' },
  { id: 3, name: 'Electrical', image: '/categories/electrical.jpg' },
  { id: 4, name: 'Plumbing', image: '/categories/plumbing.jpg' },
  { id: 5, name: 'HVAC', image: '/categories/hvac.jpg' },
  { id: 6, name: 'Safety Equipment', image: '/categories/safety.jpg' },
];

const featuredProducts = [
  {
    id: 1,
    name: 'Premium Lumber Pack',
    description: '2x4x8 Premium Grade Lumber - 100 pieces',
    price: 599.99,
    image: '/products/lumber.jpg',
    poolSize: 5,
    poolDiscount: 15,
  },
  {
    id: 2,
    name: 'Concrete Mix Bulk',
    description: 'High-Strength Concrete Mix - 50 bags',
    price: 449.99,
    image: '/products/concrete.jpg',
    poolSize: 3,
    poolDiscount: 10,
  },
  {
    id: 3,
    name: 'Steel Rebar Bundle',
    description: '#4 Rebar 20ft - 50 pieces',
    price: 799.99,
    image: '/products/rebar.jpg',
    poolSize: 4,
    poolDiscount: 12,
  },
  {
    id: 4,
    name: 'Insulation Roll Pack',
    description: 'R-19 Fiberglass Insulation - 10 rolls',
    price: 299.99,
    image: '/products/insulation.jpg',
    poolSize: 3,
    poolDiscount: 8,
  },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      switch (session.user.role) {
        case Role.super_admin:
          router.push('/admin/settings/services');
          break;
        case Role.general_contractor:
          router.push('/contractor/dashboard');
          break;
        case Role.subcontractor:
          router.push('/subcontractor/dashboard');
          break;
        case Role.supplier:
          router.push('/supplier/dashboard');
          break;
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
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

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-darker"></div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-grey-lighter/5">
      {/* Hero Section with Search */}
      <div className="bg-blue-darker text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Construction Materials at Wholesale Prices
            </h1>
            <p className="text-xl text-grey-lighter">
              Join purchase pools to save big on bulk orders
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-lighter h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search for materials, tools, and equipment..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-grey-darker"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="inventory">Sort by Inventory</option>
              </select>
              <Button size="lg">
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-grey-darker">Shop by Category</h2>
          <Link href="/categories" className="text-blue-darker hover:text-blue-lighter flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {featuredCategories.map((category) => (
            <Link key={category.id} href={`/categories/${category.id}`}>
              <Card className="hover:shadow-lg transition-shadow">
                <div className="aspect-square relative">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="object-cover w-full h-full rounded-t-lg"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-medium text-grey-darker">{category.name}</h3>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-grey-darker">Featured Products</h2>
          <Link href="/products" className="text-blue-darker hover:text-blue-lighter flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="hover:shadow-lg transition-shadow h-full">
                <div className="aspect-video relative">
                  <img
                    src={product.thumbnailUrl || '/images/product-placeholder.jpg'}
                    alt={product.name}
                    className="object-cover w-full h-full rounded-t-lg"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-grey-darker mb-2">{product.name}</h3>
                  <p className="text-sm text-grey-lighter mb-4">{product.description}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-2xl font-bold text-blue-darker">
                        ${product.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-grey-lighter">
                        Min. Order: {product.minOrderQuantity} units
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-grey-lighter">
                        {product.inventory} in stock
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <Users className="h-8 w-8" />,
                title: 'Group Buying Power',
                description: 'Join forces with other buyers to access wholesale prices',
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: 'Volume Discounts',
                description: 'Bigger pools mean bigger savings on bulk orders',
              },
              {
                icon: <Package className="h-8 w-8" />,
                title: 'Quality Products',
                description: 'Verified suppliers and quality materials',
              },
              {
                icon: <Truck className="h-8 w-8" />,
                title: 'Coordinated Delivery',
                description: 'Efficient delivery management for pool orders',
              },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-block p-3 bg-blue-lighter/10 rounded-full mb-4 text-blue-darker">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-grey-darker mb-2">
                  {feature.title}
                </h3>
                <p className="text-grey-lighter">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-darker text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-xl text-grey-lighter mb-8">
            Join Construct Depot today and transform how you purchase construction materials.
          </p>
          <AuthButtons variant="secondary" />
        </div>
      </div>
    </div>
  );
} 