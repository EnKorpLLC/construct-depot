'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Users,
  FileText,
  CheckSquare,
} from 'lucide-react';

interface ProjectDetail {
  id: string;
  title: string;
  generalContractor: string;
  location: string;
  tradeType: string;
  budget: number;
  startDate: Date;
  duration: string;
  matchScore?: number;
  status: 'open' | 'closing_soon' | 'reviewing' | 'awarded';
  requirements: string[];
  bidsDue: Date;
  description: string;
  scope: string[];
  attachments: { name: string; url: string }[];
  currentBids: number;
  averageBid?: number;
}

export default function ProjectDetailPage() {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidNotes, setBidNotes] = useState('');
  const params = useParams();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        // Replace with actual API call
        const mockProject: ProjectDetail = {
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
          description: 'Complete electrical installation for a new 10-story commercial office building including power distribution, lighting, and emergency systems.',
          scope: [
            'Main electrical service installation',
            'Emergency power systems',
            'Lighting installation and controls',
            'Fire alarm system integration',
            'Building automation system integration'
          ],
          attachments: [
            { name: 'Project Specifications.pdf', url: '/specs.pdf' },
            { name: 'Electrical Plans.dwg', url: '/plans.dwg' }
          ],
          currentBids: 5,
          averageBid: 275000
        };
        setProject(mockProject);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add bid submission logic
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
                <div className="flex items-center text-gray-500 mb-2">
                  <Building2 className="h-4 w-4 mr-2" />
                  {project.generalContractor}
                </div>
                <div className="flex items-center text-gray-500 mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  {project.location}
                </div>
                <div className="flex items-center text-gray-500">
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
                <div className="flex items-center mt-2">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-1" />
                  <span className="text-lg font-semibold text-gray-900">
                    ${project.budget.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Project Description</h2>
                <p className="text-gray-600">{project.description}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Scope of Work</h2>
                <ul className="space-y-2">
                  {project.scope.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckSquare className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Requirements</h2>
                <div className="flex flex-wrap gap-2">
                  {project.requirements.map((req, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Project Documents</h2>
                <div className="space-y-2">
                  {project.attachments.map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      className="flex items-center p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-blue-600">{file.name}</span>
                    </a>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        Start Date
                      </div>
                      <span className="text-gray-900">
                        {project.startDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-4 w-4 mr-2" />
                        Duration
                      </div>
                      <span className="text-gray-900">{project.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-500">
                        <Users className="h-4 w-4 mr-2" />
                        Current Bids
                      </div>
                      <span className="text-gray-900">{project.currentBids}</span>
                    </div>
                    {project.averageBid && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-500">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Average Bid
                        </div>
                        <span className="text-gray-900">
                          ${project.averageBid.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {session?.user?.role === 'SUBCONTRACTOR' && project.status === 'open' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Submit Bid</h3>
                    <form onSubmit={handleSubmitBid} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bid Amount
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="text"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="pl-10 w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter amount"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={bidNotes}
                          onChange={(e) => setBidNotes(e.target.value)}
                          rows={4}
                          className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Add any additional notes..."
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Submit Bid
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 