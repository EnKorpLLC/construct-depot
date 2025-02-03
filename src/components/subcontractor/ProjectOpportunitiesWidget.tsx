'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Building2, Calendar, DollarSign, Percent, Star, Filter } from 'lucide-react';

interface ProjectOpportunity {
  id: string;
  title: string;
  generalContractor: string;
  location: string;
  tradeType: string;
  budget: number;
  startDate: Date;
  duration: string;
  matchScore: number;
  status: 'open' | 'closing_soon' | 'reviewing' | 'awarded';
  requirements: string[];
  bidsDue: Date;
}

export default function ProjectOpportunitiesWidget() {
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  
  // Mock data - will be replaced with API calls
  const opportunities: ProjectOpportunity[] = [
    {
      id: '1',
      title: 'Commercial Office Electrical Installation',
      generalContractor: 'ABC Construction',
      location: 'Downtown Metro Area',
      tradeType: 'Electrical',
      budget: 250000,
      startDate: new Date('2024-03-01'),
      duration: '3 months',
      matchScore: 92,
      status: 'open',
      requirements: ['Licensed Electricians', '10+ years experience', 'Commercial projects'],
      bidsDue: new Date('2024-02-15'),
    },
    {
      id: '2',
      title: 'Hospital Wing Plumbing System',
      generalContractor: 'Healthcare Builders Inc',
      location: 'Medical District',
      tradeType: 'Plumbing',
      budget: 375000,
      startDate: new Date('2024-04-01'),
      duration: '4 months',
      matchScore: 85,
      status: 'closing_soon',
      requirements: ['Medical facility experience', 'Licensed plumbers', 'Safety certification'],
      bidsDue: new Date('2024-02-10'),
    },
  ];

  const trades = ['All', 'Electrical', 'Plumbing', 'HVAC', 'Carpentry'];

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-grey-darker">Project Opportunities</h2>
          <Button variant="outline" size="sm">
            View All Projects
          </Button>
        </div>

        {/* Trade Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-grey-lighter" />
          {trades.map((trade) => (
            <button
              key={trade}
              onClick={() => setSelectedTrade(trade === 'All' ? null : trade)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap
                ${selectedTrade === trade || (trade === 'All' && !selectedTrade)
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-grey-lighter/10 text-grey-darker hover:bg-grey-lighter/20'}`}
            >
              {trade}
            </button>
          ))}
        </div>

        {/* Opportunities List */}
        <div className="space-y-6">
          {opportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="border border-grey-lighter rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-grey-darker">{opportunity.title}</h3>
                  <p className="text-sm text-grey-lighter">
                    {opportunity.generalContractor} • {opportunity.location}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-2 py-1 rounded text-sm font-medium mb-2
                    ${opportunity.status === 'open' ? 'bg-green-100 text-green-800' :
                      opportunity.status === 'closing_soon' ? 'bg-yellow-100 text-yellow-800' :
                      opportunity.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'}`}
                  >
                    {opportunity.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">{opportunity.matchScore}% Match</span>
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-grey-lighter" />
                  <div className="text-sm">
                    <span className="text-grey-lighter">Budget:</span>
                    <span className="font-medium ml-1">
                      ${opportunity.budget.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-grey-lighter" />
                  <div className="text-sm">
                    <span className="text-grey-lighter">Start:</span>
                    <span className="font-medium ml-1">
                      {opportunity.startDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-grey-lighter" />
                  <div className="text-sm">
                    <span className="text-grey-lighter">Trade:</span>
                    <span className="font-medium ml-1">{opportunity.tradeType}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Percent className="h-4 w-4 text-grey-lighter" />
                  <div className="text-sm">
                    <span className="text-grey-lighter">Duration:</span>
                    <span className="font-medium ml-1">{opportunity.duration}</span>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-grey-darker mb-2">Requirements</h4>
                <div className="flex flex-wrap gap-2">
                  {opportunity.requirements.map((req, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-grey-lighter/10 rounded-full text-xs text-grey-darker"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bid Due Date */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-grey-darker mb-1">
                  <span>Time Remaining</span>
                  <span>Bids due {opportunity.bidsDue.toLocaleDateString()}</span>
                </div>
                <Progress
                  value={Math.max(0, Math.min(100, (
                    (opportunity.bidsDue.getTime() - new Date().getTime()) /
                    (opportunity.bidsDue.getTime() - opportunity.startDate.getTime())
                  ) * 100))}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button size="sm">
                  Submit Bid
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 