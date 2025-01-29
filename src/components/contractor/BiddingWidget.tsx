'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { FileText, Calculator, Clock, ArrowRight } from 'lucide-react';

interface Bid {
  id: string;
  projectName: string;
  status: 'analyzing' | 'ready' | 'submitted' | 'won' | 'lost';
  progress: number;
  dueDate: Date;
  estimatedValue: number;
  materials: Array<{
    name: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
  }>;
  laborHours: number;
}

export default function BiddingWidget() {
  const [activeBids, setActiveBids] = useState<Bid[]>([
    {
      id: '1',
      projectName: 'City Center Complex',
      status: 'analyzing',
      progress: 75,
      dueDate: new Date('2024-02-28'),
      estimatedValue: 2500000,
      materials: [
        { name: 'Concrete', quantity: 500, unit: 'cubic yards', estimatedCost: 75000 },
        { name: 'Steel Rebar', quantity: 25, unit: 'tons', estimatedCost: 45000 },
      ],
      laborHours: 12000,
    },
    // Add more mock bids as needed
  ]);

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">AI-Powered Bidding</h2>
          <Button variant="outline" size="sm">
            New Bid
          </Button>
        </div>

        <div className="space-y-6">
          {/* AI Analysis Status */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-900">Blueprint Analysis</h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                In Progress
              </span>
            </div>
            <Progress value={75} className="mb-2" />
            <div className="text-xs text-blue-700">
              AI is analyzing project requirements and calculating estimates
            </div>
          </div>

          {/* Active Bids */}
          <div className="space-y-4">
            {activeBids.map((bid) => (
              <div
                key={bid.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{bid.projectName}</h3>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      Due: {bid.dueDate.toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm font-medium
                    ${bid.status === 'analyzing' ? 'bg-blue-100 text-blue-800' :
                      bid.status === 'ready' ? 'bg-green-100 text-green-800' :
                      bid.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      bid.status === 'won' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'}`}
                  >
                    {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Estimated Value</div>
                    <div className="font-medium">${bid.estimatedValue.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Materials</div>
                    <div className="font-medium">{bid.materials.length} Items</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Labor Hours</div>
                    <div className="font-medium">{bid.laborHours.toLocaleString()}</div>
                  </div>
                </div>

                {/* Material Breakdown */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Material Estimates</h4>
                  <div className="space-y-2">
                    {bid.materials.map((material, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{material.name}</span>
                        <span className="text-gray-600">
                          {material.quantity} {material.unit} (${material.estimatedCost.toLocaleString()})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button size="sm">
                    <Calculator className="w-4 h-4 mr-1" />
                    Adjust Estimate
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <FileText className="w-4 h-4 mr-2" />
              <span className="text-sm">Upload Blueprints</span>
            </button>
            <button className="flex items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Calculator className="w-4 h-4 mr-2" />
              <span className="text-sm">Quick Estimate</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
} 