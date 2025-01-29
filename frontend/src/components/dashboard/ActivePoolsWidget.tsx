import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface PooledProduct {
  id: string;
  name: string;
  currentQuantity: number;
  targetQuantity: number;
  progress: number;
  price: number;
  orders: Array<{
    id: string;
    user: {
      name: string;
    };
    quantity: number;
  }>;
}

export function ActivePoolsWidget() {
  const [pools, setPools] = useState<PooledProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivePools();
  }, []);

  const fetchActivePools = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pools/active');
      if (!response.ok) throw new Error('Failed to fetch active pools');
      const data = await response.json();
      setPools(data.pools || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading active pools...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!pools.length) return <div>No active pools</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Pools</CardTitle>
        <CardDescription>
          Currently active product pools and their progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {pools.map((pool) => (
          <div key={pool.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{pool.name}</h3>
                <p className="text-sm text-gray-500">
                  {pool.currentQuantity} / {pool.targetQuantity} units
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(pool.price)}</p>
                <p className="text-sm text-gray-500">
                  {pool.orders.length} order{pool.orders.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Progress value={pool.progress} />
            <div className="text-sm text-gray-500">
              {pool.orders.map((order) => (
                <div key={order.id} className="flex justify-between">
                  <span>{order.user.name}</span>
                  <span>{order.quantity} units</span>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.location.href = `/pools/${pool.id}`}
            >
              View Details
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 