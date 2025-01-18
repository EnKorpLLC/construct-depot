'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { OrderStatus } from '@prisma/client';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Progress } from '@/components/ui/progress';

interface Pool {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  poolExpiry: string;
  currentQuantity: number;
  targetQuantity: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    product: {
      name: string;
      description: string;
      minOrderQuantity: number;
    };
  }>;
}

export function PoolManagement() {
  const router = useRouter();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [joinQuantity, setJoinQuantity] = useState<number>(0);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders/pool');
      const data = await response.json();
      setPools(data.pools);
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPool = async () => {
    if (!selectedPool) return;

    try {
      setLoading(true);
      const response = await fetch('/api/orders/pool/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool.id,
          quantity: joinQuantity
        })
      });

      if (!response.ok) throw new Error('Failed to join pool');
      
      const data = await response.json();
      router.push(`/orders/${data.id}`);
    } catch (error) {
      console.error('Error joining pool:', error);
      alert('Failed to join pool. Please try again.');
    } finally {
      setLoading(false);
      setShowJoinModal(false);
    }
  };

  const calculateProgress = (pool: Pool) => {
    return (pool.currentQuantity / pool.targetQuantity) * 100;
  };

  const calculateTimeRemaining = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const openJoinModal = (pool: Pool) => {
    setSelectedPool(pool);
    setJoinQuantity(pool.items[0].product.minOrderQuantity);
    setShowJoinModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Active Pools</h1>
        <Button onClick={() => router.push('/orders/new?type=pool')}>
          Create Pool
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : pools.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No active pools found</p>
            <Button
              className="mt-4"
              onClick={() => router.push('/orders/new?type=pool')}
            >
              Create a Pool
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pools.map((pool) => (
            <Card key={pool.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {pool.items[0].product.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {pool.orderNumber}
                    </p>
                  </div>
                  <Badge>
                    {calculateTimeRemaining(pool.poolExpiry)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>
                      {pool.currentQuantity} / {pool.targetQuantity} units
                    </span>
                  </div>
                  <Progress value={calculateProgress(pool)} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Unit Price</span>
                    <span>{formatCurrency(pool.items[0].unitPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min. Quantity</span>
                    <span>{pool.items[0].product.minOrderQuantity} units</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total Pool Value</span>
                    <span>{formatCurrency(pool.totalAmount)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => openJoinModal(pool)}
                >
                  Join Pool
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showJoinModal && selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h2 className="text-lg font-semibold">Join Pool</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">
                  {selectedPool.items[0].product.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedPool.items[0].product.description}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  min={selectedPool.items[0].product.minOrderQuantity}
                  value={joinQuantity}
                  onChange={(e) => setJoinQuantity(Number(e.target.value))}
                />
                <p className="text-sm text-gray-500">
                  Minimum order quantity: {selectedPool.items[0].product.minOrderQuantity}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Unit Price</span>
                  <span>{formatCurrency(selectedPool.items[0].unitPrice)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>
                    {formatCurrency(joinQuantity * selectedPool.items[0].unitPrice)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleJoinPool}
                  disabled={loading}
                >
                  {loading ? 'Joining...' : 'Join Pool'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 