'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Star, MapPin, Clock, DollarSign, Building2 } from 'lucide-react';

type ProjectStatus = 'open' | 'closing_soon' | 'reviewing' | 'awarded';

interface Project {
  id: string;
  title: string;
  generalContractor: string;
  location: string;
  tradeType: string;
  budget: number;
  startDate: Date;
  duration: string;
  matchScore?: number;
  status: ProjectStatus;
  requirements: string[];
  bidsDue: Date;
  description: string;
}

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'budget' | 'match'>('date');
  const { data: session } = useSession();

  // Mock data - replace with API call
  const projects: Project[] = [
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
      description: 'Complete electrical installation for a new 10-story commercial office building...'
    },
    // Add more mock projects
  ];

  const trades = ['All', 'Electrical', 'Plumbing', 'HVAC', 'Carpentry', 'Masonry'];

  const filteredProjects = projects.filter(project =>
    (searchTerm === '' || 
     project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     project.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedTrade === null || selectedTrade === 'All' || project.tradeType === selectedTrade)
  );

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return a.bidsDue.getTime() - b.bidsDue.getTime();
      case 'budget':
        return b.budget - a.budget;
      case 'match':
        return (b.matchScore || 0) - (a.matchScore || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-grey-lighter/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-grey-darker">Project Opportunities</h1>
          {session?.user?.role === 'GENERAL_CONTRACTOR' && (
            <Link
              href="/contractor/projects/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Post New Project
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
              <div className="w-full sm:w-auto flex space-x-4">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border rounded-lg w-full sm:w-64"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'budget' | 'match')}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="date">Sort by Date</option>
                  <option value="budget">Sort by Budget</option>
                  <option value="match">Sort by Match</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {trades.map((trade) => (
                  <button
                    key={trade}
                    onClick={() => setSelectedTrade(selectedTrade === trade ? null : trade)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                      ${selectedTrade === trade
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-grey-lighter/10 text-grey-darker hover:bg-grey-lighter/20'}`}
                  >
                    {trade}
                  </button>
                ))}
              </div>
            </div>

            {/* Projects List */}
            <div className="space-y-6">
              {sortedProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block border border-grey-lighter rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-grey-darker mb-2">{project.title}</h2>
                      <div className="flex items-center text-grey-lighter mb-2">
                        <Building2 className="h-4 w-4 mr-2" />
                        {project.generalContractor}
                      </div>
                      <div className="flex items-center text-grey-lighter mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        {project.location}
                      </div>
                      <div className="flex items-center text-grey-lighter">
                        <Clock className="h-4 w-4 mr-2" />
                        Bids due: {project.bidsDue.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium mb-2
                        ${project.status === 'open' ? 'bg-green-100 text-green-800' :
                          project.status === 'closing_soon' ? 'bg-yellow-100 text-yellow-800' :
                          project.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'}`}
                      >
                        {project.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {project.matchScore && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium">{project.matchScore}% Match</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-grey-lighter mr-1" />
                      <span className="text-lg font-semibold text-grey-darker">
                        ${project.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.requirements.map((req, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-grey-lighter/10 text-grey-darker rounded text-sm"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 