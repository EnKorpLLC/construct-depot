'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Star, MessageSquare, Building2, Users } from 'lucide-react';

interface Subcontractor {
  id: string;
  name: string;
  trade: string;
  rating: number;
  completedProjects: number;
  activeProjects: number;
  teamSize: number;
  specialties: string[];
  status: 'available' | 'busy' | 'unavailable';
  lastActive: Date;
}

export default function SubcontractorManagementWidget() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);

  // Mock data - will be replaced with API calls
  const subcontractors: Subcontractor[] = [
    {
      id: '1',
      name: 'Elite Electrical Services',
      trade: 'Electrical',
      rating: 4.8,
      completedProjects: 127,
      activeProjects: 3,
      teamSize: 15,
      specialties: ['Commercial', 'Industrial', 'Solar'],
      status: 'available',
      lastActive: new Date('2024-01-10'),
    },
    {
      id: '2',
      name: 'Premier Plumbing Co',
      trade: 'Plumbing',
      rating: 4.6,
      completedProjects: 95,
      activeProjects: 2,
      teamSize: 12,
      specialties: ['Commercial', 'Residential'],
      status: 'busy',
      lastActive: new Date('2024-01-11'),
    },
  ];

  const trades = ['Electrical', 'Plumbing', 'HVAC', 'Carpentry', 'Masonry'];

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Subcontractor Management</h2>
          <Button variant="outline" size="sm">
            Find Subcontractors
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search subcontractors..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Trade Filters */}
          <div className="flex flex-wrap gap-2">
            {trades.map((trade) => (
              <button
                key={trade}
                onClick={() => setSelectedTrade(selectedTrade === trade ? null : trade)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                  ${selectedTrade === trade
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {trade}
              </button>
            ))}
          </div>
        </div>

        {/* Subcontractor List */}
        <div className="space-y-4">
          {subcontractors.map((sub) => (
            <div
              key={sub.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{sub.name}</h3>
                  <p className="text-sm text-gray-500">{sub.trade}</p>
                </div>
                <span className={`px-2 py-1 rounded text-sm font-medium
                  ${sub.status === 'available' ? 'bg-green-100 text-green-800' :
                    sub.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'}`}
                >
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <div className="text-sm">
                    <span className="font-medium">{sub.rating}</span>
                    <span className="text-gray-500">/5</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    <span className="font-medium">{sub.completedProjects}</span>
                    <span className="text-gray-500"> completed</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    <span className="font-medium">{sub.activeProjects}</span>
                    <span className="text-gray-500"> active</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    <span className="font-medium">{sub.teamSize}</span>
                    <span className="text-gray-500"> team members</span>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {sub.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  View Profile
                </Button>
                <Button size="sm">
                  Contact
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 