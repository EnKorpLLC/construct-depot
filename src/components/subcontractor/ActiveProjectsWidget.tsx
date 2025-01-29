'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart2,
} from 'lucide-react';

interface ActiveProject {
  id: string;
  name: string;
  generalContractor: string;
  progress: number;
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  team: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    dueDate: Date;
    status: 'completed' | 'in_progress' | 'upcoming' | 'delayed';
  }>;
  status: 'on_track' | 'at_risk' | 'delayed';
  healthMetrics: {
    schedule: number;
    budget: number;
    quality: number;
  };
}

export default function ActiveProjectsWidget() {
  // Mock data - will be replaced with API calls
  const projects: ActiveProject[] = [
    {
      id: '1',
      name: 'Metro Station Electrical Systems',
      generalContractor: 'Transit Builders Corp',
      progress: 45,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      budget: 450000,
      spent: 180000,
      team: [
        { id: '1', name: 'Mike Johnson', role: 'Lead Electrician' },
        { id: '2', name: 'Sarah Chen', role: 'Systems Engineer' },
      ],
      milestones: [
        {
          id: '1',
          title: 'Main Power Distribution',
          dueDate: new Date('2024-02-28'),
          status: 'in_progress',
        },
        {
          id: '2',
          title: 'Emergency Systems',
          dueDate: new Date('2024-03-15'),
          status: 'upcoming',
        },
      ],
      status: 'on_track',
      healthMetrics: {
        schedule: 95,
        budget: 90,
        quality: 100,
      },
    },
    {
      id: '2',
      name: 'Hospital Emergency Wing',
      generalContractor: 'Healthcare Builders Inc',
      progress: 30,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-07-15'),
      budget: 650000,
      spent: 175000,
      team: [
        { id: '3', name: 'Robert Kim', role: 'Project Lead' },
        { id: '4', name: 'Emily Davis', role: 'Safety Coordinator' },
      ],
      milestones: [
        {
          id: '3',
          title: 'Foundation Work',
          dueDate: new Date('2024-02-20'),
          status: 'completed',
        },
        {
          id: '4',
          title: 'Structural Steel',
          dueDate: new Date('2024-03-01'),
          status: 'delayed',
        },
      ],
      status: 'at_risk',
      healthMetrics: {
        schedule: 75,
        budget: 85,
        quality: 95,
      },
    },
  ];

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Active Projects</h2>
          <Button variant="outline" size="sm">
            View All Projects
          </Button>
        </div>

        {/* Projects List */}
        <div className="space-y-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-500">
                    {project.generalContractor}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-sm font-medium
                  ${project.status === 'on_track' ? 'bg-green-100 text-green-800' :
                    project.status === 'at_risk' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'}`}
                >
                  {project.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Overall Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>

              {/* Project Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    <span className="text-gray-500">End Date:</span>
                    <span className="font-medium ml-1">
                      {project.endDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    <span className="text-gray-500">Budget Used:</span>
                    <span className="font-medium ml-1">
                      {Math.round((project.spent / project.budget) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    <span className="text-gray-500">Team:</span>
                    <span className="font-medium ml-1">
                      {project.team.length} members
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    <span className="text-gray-500">Days Left:</span>
                    <span className="font-medium ml-1">
                      {Math.ceil((project.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Health Metrics */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Project Health</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Schedule</span>
                      <span className={`text-xs font-medium
                        ${project.healthMetrics.schedule >= 90 ? 'text-green-600' :
                          project.healthMetrics.schedule >= 75 ? 'text-yellow-600' :
                          'text-red-600'}`}
                      >
                        {project.healthMetrics.schedule}%
                      </span>
                    </div>
                    <Progress value={project.healthMetrics.schedule} />
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Budget</span>
                      <span className={`text-xs font-medium
                        ${project.healthMetrics.budget >= 90 ? 'text-green-600' :
                          project.healthMetrics.budget >= 75 ? 'text-yellow-600' :
                          'text-red-600'}`}
                      >
                        {project.healthMetrics.budget}%
                      </span>
                    </div>
                    <Progress value={project.healthMetrics.budget} />
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Quality</span>
                      <span className={`text-xs font-medium
                        ${project.healthMetrics.quality >= 90 ? 'text-green-600' :
                          project.healthMetrics.quality >= 75 ? 'text-yellow-600' :
                          'text-red-600'}`}
                      >
                        {project.healthMetrics.quality}%
                      </span>
                    </div>
                    <Progress value={project.healthMetrics.quality} />
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Key Milestones</h4>
                <div className="space-y-2">
                  {project.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <div className="flex items-center">
                        {milestone.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        ) : milestone.status === 'delayed' ? (
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-500 mr-2" />
                        )}
                        <span className="text-sm">{milestone.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded
                        ${milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                          milestone.status === 'delayed' ? 'bg-red-100 text-red-800' :
                          milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}`}
                      >
                        {milestone.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button size="sm">
                  Update Progress
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 