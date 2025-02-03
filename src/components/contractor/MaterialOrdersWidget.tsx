'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Package, Truck, DollarSign, Users, AlertCircle } from 'lucide-react';

interface MaterialOrder {
  id: string;
  projectName: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'pooling';
  progress: number;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  supplier: string;
  estimatedDelivery: Date;
  poolParticipants?: number;
  poolProgress?: number;
}

export default function MaterialOrdersWidget() {
  // Mock data - will be replaced with API calls
  const orders: MaterialOrder[] = [
    {
      id: '1',
      projectName: 'Downtown Office Complex',
      status: 'pooling',
      progress: 65,
      totalAmount: 125000,
      items: [
        { name: 'Steel Beams', quantity: 50, unit: 'pieces', price: 1500 },
        { name: 'Concrete Mix', quantity: 200, unit: 'bags', price: 250 },
      ],
      supplier: 'Steel & Materials Co.',
      estimatedDelivery: new Date('2024-02-15'),
      poolParticipants: 3,
      poolProgress: 65,
    },
    {
      id: '2',
      projectName: 'Retail Center Renovation',
      status: 'shipped',
      progress: 100,
      totalAmount: 75000,
      items: [
        { name: 'Glass Panels', quantity: 30, unit: 'pieces', price: 2000 },
        { name: 'Aluminum Frames', quantity: 30, unit: 'sets', price: 500 },
      ],
      supplier: 'Modern Glass Solutions',
      estimatedDelivery: new Date('2024-01-30'),
    },
  ];

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-grey-darker">Material Orders</h2>
          <Button variant="outline" size="sm">
            New Order
          </Button>
        </div>

        {/* Active Pool Alert */}
        <div className="bg-blue-lighter/10 border border-blue-lighter rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-darker mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-darker">Active Pool Opportunity</h3>
              <p className="text-sm text-blue-darker mt-1">
                Join the bulk order pool for steel materials and save up to 20% on your order.
              </p>
              <Button size="sm" className="mt-2">
                View Pool Details
              </Button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-grey-lighter rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-grey-darker">{order.projectName}</h3>
                  <p className="text-sm text-grey-lighter">
                    Supplier: {order.supplier}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-sm font-medium
                  ${order.status === 'pooling' ? 'bg-blue-lighter/10 text-blue-darker' :
                    order.status === 'processing' ? 'bg-osb-light/10 text-osb-dark' :
                    order.status === 'shipped' ? 'bg-grey-lighter/20 text-grey-darker' :
                    order.status === 'delivered' ? 'bg-blue-lighter/10 text-blue-darker' :
                    'bg-orange-lighter/10 text-orange-darker'}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              {/* Order Progress */}
              {order.status === 'pooling' && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-grey-darker mb-1">
                    <span>Pool Progress</span>
                    <span>{order.poolProgress ?? 0}%</span>
                  </div>
                  <Progress value={order.poolProgress ?? 0} className="mb-2" />
                  <p className="text-sm text-grey-lighter">
                    {order.poolParticipants} participants in this pool
                  </p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-grey-darker" />
                  <div className="text-sm">
                    <span className="text-grey-lighter">Items:</span>
                    <span className="font-medium ml-1">{order.items.length}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-grey-darker" />
                  <div className="text-sm">
                    <span className="text-grey-lighter">Total:</span>
                    <span className="font-medium ml-1">
                      ${order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4 text-grey-darker" />
                  <div className="text-sm">
                    <span className="text-grey-lighter">Delivery:</span>
                    <span className="font-medium ml-1">
                      {order.estimatedDelivery.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {order.poolParticipants && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-grey-darker" />
                    <div className="text-sm">
                      <span className="text-grey-lighter">Pool:</span>
                      <span className="font-medium ml-1">
                        {order.poolParticipants} members
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-grey-darker mb-2">Order Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-grey-darker">{item.name}</span>
                      <span className="text-grey-lighter">
                        {item.quantity} {item.unit} (${item.price.toLocaleString()}/unit)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  Track Order
                </Button>
                <Button size="sm">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 