'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import {
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  FileText,
} from 'lucide-react';
import CustomerDashboardService from '@/services/customer/dashboardService';
import useWebSocket from '@/hooks/useWebSocket';

interface Project {
  id: string;
  name: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  progress: number;
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  contractor: {
    name: string;
    rating: number;
    contact: string;
  };
  team: Array<{
    name: string;
    role: string;
  }>;
  documents: Array<{
    name: string;
    type: string;
    lastUpdated: Date;
  }>;
  nextMilestone: {
    name: string;
    dueDate: Date;
  };
}

export default function ProjectOverviewWidget() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await CustomerDashboardService.getProjects();
        setProjects(data);
        setError(null);
      } catch (err) {
        setError('Failed to load projects. Please try again later.');
        console.error('Error loading projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // WebSocket subscriptions for real-time updates
  useWebSocket({
    url: 'ws://localhost:3000/api/ws',
    onMessage: (message) => {
      if (message.type === 'project_updated') {
        const updatedProject = message.payload as Project;
        setProjects(prev =>
          prev.map(project =>
            project.id === updatedProject.id ? updatedProject : project
          )
        );
      }
    }
  });

  useWebSocket({
    url: 'ws://localhost:3000/api/ws',
    onMessage: (message) => {
      if (message.type === 'project_deleted') {
        const projectId = message.payload as string;
        setProjects(prev => prev.filter(project => project.id !== projectId));
      }
    }
  });

  useWebSocket({
    url: 'ws://localhost:3000/api/ws',
    onMessage: (message) => {
      if (message.type === 'document_added') {
        const update = message.payload as { projectId: string; document: Project['documents'][0] };
        setProjects(prev =>
          prev.map(project =>
            project.id === update.projectId
              ? {
                  ...project,
                  documents: [...project.documents, update.document]
                }
              : project
          )
        );
      }
    }
  });

  useWebSocket({
    url: 'ws://localhost:3000/api/ws',
    onMessage: (message) => {
      if (message.type === 'milestone_updated') {
        const update = message.payload as { projectId: string; milestone: Project['nextMilestone'] };
        setProjects(prev =>
          prev.map(project =>
            project.id === update.projectId
              ? {
                  ...project,
                  nextMilestone: update.milestone
                }
              : project
          )
        );
      }
    }
  });

  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      await CustomerDashboardService.updateProject(projectId, updates);
      // No need to update state here as it will be handled by WebSocket
    } catch (err) {
      console.error('Error updating project:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-grey-darker">My Projects</h2>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-grey-darker">My Projects</h2>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">{error}</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-grey-darker">My Projects</h2>
          <Button variant="outline" size="sm">
            View All Projects
          </Button>
        </div>

        {/* Projects List */}
        <div className="space-y-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-grey-lighter rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-grey-darker">{project.name}</h3>
                  <p className="text-sm text-grey-lighter">
                    Contractor: {project.contractor.name}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-sm font-medium
                  ${project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                    project.status === 'on_hold' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'}`}
                >
                  {project.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-grey-darker mb-1">
                  <span>Overall Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>

              {/* Project Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-grey-lighter" />
                  <div className="text-sm">
                    <span className="text-grey-lighter">End Date:</span>
                    <span className="font-medium ml-1">
                      {project.endDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-grey-lighter" />
                  <div className="text-sm">
                    <span className="text-grey-lighter">Budget Used:</span>
                    <span className="font-medium ml-1">
                      {Math.round((project.spent / project.budget) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-grey-lighter" />
                  <div className="text-sm">
                    <span className="text-grey-lighter">Team:</span>
                    <span className="font-medium ml-1">
                      {project.team.length} members
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-grey-lighter" />
                  <div className="text-sm">
                    <span className="text-grey-lighter">Days Left:</span>
                    <span className="font-medium ml-1">
                      {Math.ceil((project.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Milestone */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-blue-900">
                        Next Milestone: {project.nextMilestone.name}
                      </div>
                      <div className="text-xs text-blue-700">
                        Due: {project.nextMilestone.dueDate.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white">
                    View Timeline
                  </Button>
                </div>
              </div>

              {/* Recent Documents */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-grey-darker mb-2">Recent Documents</h4>
                <div className="space-y-2">
                  {project.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-grey-lighter/10 p-2 rounded"
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-grey-lighter mr-2" />
                        <span className="text-sm">{doc.name}</span>
                      </div>
                      <div className="text-xs text-grey-lighter">
                        Updated {doc.lastUpdated.toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  Contact Team
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