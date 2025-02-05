'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Users, Clock, Package, AlertTriangle } from 'lucide-react';
import { Pool, PoolStatus } from '@prisma/client';

interface PoolWithDetails extends Pool {
  product: {
    name: string;
    price: number;
    unit: string;
  };
  orders: Array<{
    id: string;
    quantity: number;
    user: {
      name: string;
    };
  }>;
}

export default function PoolManagementDashboard() {
  const [pools, setPools] = useState<PoolWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      const response = await fetch('/api/pools');
      if (!response.ok) throw new Error('Failed to fetch pools');
      const data = await response.json();
      setPools(data.pools);
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePoolStatus = async (poolId: string, status: PoolStatus) => {
    try {
      const response = await fetch(`/api/orders/pool`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId, status })
      });
      
      if (!response.ok) throw new Error('Failed to update pool status');
      
      // Refresh pools after update
      fetchPools();
    } catch (error) {
      console.error('Error updating pool status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-darker"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-grey-darker">Pool Management</h2>
        <Button variant="outline">Export Data</Button>
      </div>

      {/* Pool Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-grey-lighter">Active Pools</p>
              <p className="text-2xl font-bold text-grey-darker">
                {pools.filter(p => p.status === PoolStatus.OPEN).length}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-darker" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-grey-lighter">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-darker">
                {pools.filter(p => {
                  const daysUntilExpiry = Math.ceil((new Date(p.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return daysUntilExpiry <= 3 && p.status === PoolStatus.OPEN;
                }).length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-darker" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-grey-lighter">Completed Pools</p>
              <p className="text-2xl font-bold text-green-600">
                {pools.filter(p => p.status === PoolStatus.COMPLETED).length}
              </p>
            </div>
            <Package className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-grey-lighter">Cancelled Pools</p>
              <p className="text-2xl font-bold text-red-600">
                {pools.filter(p => p.status === PoolStatus.CANCELLED).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Active Pools List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-grey-darker">Active Pools</h3>
        {pools
          .filter(pool => pool.status === PoolStatus.OPEN)
          .map(pool => (
            <Card key={pool.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-medium text-grey-darker">
                    {pool.product.name}
                  </h4>
                  <p className="text-sm text-grey-lighter">
                    Target: {pool.targetQuantity} {pool.product.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-grey-darker">
                    Progress: {Math.round((pool.currentQuantity / pool.targetQuantity) * 100)}%
                  </p>
                  <p className="text-sm text-grey-lighter">
                    {pool.orders.length} participants
                  </p>
                </div>
              </div>

              <Progress 
                value={(pool.currentQuantity / pool.targetQuantity) * 100} 
                className="mb-4"
              />

              <div className="flex justify-between items-center text-sm text-grey-lighter mb-4">
                <span>Current: {pool.currentQuantity} {pool.product.unit}</span>
                <span>Target: {pool.targetQuantity} {pool.product.unit}</span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-grey-lighter">
                    Expires: {new Date(pool.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleUpdatePoolStatus(pool.id, PoolStatus.CANCELLED)}
                  >
                    Cancel Pool
                  </Button>
                  <Button
                    onClick={() => handleUpdatePoolStatus(pool.id, PoolStatus.COMPLETED)}
                  >
                    Complete Pool
                  </Button>
                </div>
              </div>
            </Card>
          ))}
      </div>

      {/* Completed and Cancelled Pools */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-grey-darker">Past Pools</h3>
        {pools
          .filter(pool => pool.status !== PoolStatus.OPEN)
          .map(pool => (
            <Card key={pool.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-grey-darker">
                    {pool.product.name}
                  </h4>
                  <p className="text-sm text-grey-lighter">
                    {pool.currentQuantity} / {pool.targetQuantity} {pool.product.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-sm font-medium
                    ${pool.status === PoolStatus.COMPLETED ? 'bg-green-100 text-green-800' : 
                      'bg-red-100 text-red-800'}`}
                  >
                    {pool.status}
                  </span>
                  <p className="text-sm text-grey-lighter mt-1">
                    {new Date(pool.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
} 