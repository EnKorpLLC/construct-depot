'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Calendar } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  progress: number;
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  team: Array<{
    id: string;
    name: string;
    role: string;
    avatar?: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'completed';
    dueDate: Date;
  }>;
}

export default function ProjectManagementWidget() {
  const [activeTab, setActiveTab] = useState('active');
  
  // Temporary mock data - will be replaced with API calls
  const projects: Project[] = [
    {
      id: '1',
      name: 'Downtown Office Renovation',
      status: 'in_progress',
      progress: 65,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      budget: 1500000,
      spent: 875000,
      team: [
        { id: '1', name: 'John Doe', role: 'Project Manager' },
        { id: '2', name: 'Jane Smith', role: 'Site Supervisor' },
      ],
      tasks: [
        { id: '1', title: 'HVAC Installation', status: 'in_progress', dueDate: new Date('2024-02-15') },
        { id: '2', title: 'Electrical Wiring', status: 'todo', dueDate: new Date('2024-03-01') },
      ],
    },
    // Add more mock projects as needed
  ];

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-grey-darker">Project Management</h2>
          <button className="text-blue-darker hover:text-blue-lighter transition-colors">
            View All Projects
          </button>
        </div>

        <TabsRoot defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Projects</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg border border-grey-lighter p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-grey-darker">
                      {project.name}
                    </h3>
                    <p className="text-sm text-grey-lighter flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium
                    ${project.status === 'in_progress' ? 'bg-blue-lighter/10 text-blue-darker' :
                      project.status === 'planning' ? 'bg-osb-light/10 text-osb-dark' :
                      project.status === 'on_hold' ? 'bg-orange-lighter/10 text-orange-darker' :
                      'bg-grey-lighter/20 text-grey-darker'}`}
                  >
                    {project.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-grey-darker mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>

                  {/* Budget Overview */}
                  <div className="flex justify-between text-sm">
                    <span className="text-grey-darker">Budget</span>
                    <span className="font-medium">
                      ${project.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-grey-darker">Spent</span>
                    <span className="font-medium">
                      ${project.spent.toLocaleString()} ({Math.round((project.spent / project.budget) * 100)}%)
                    </span>
                  </div>

                  {/* Team Members */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-grey-darker mb-2">Team</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.team.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center bg-grey-lighter/20 rounded-full px-3 py-1"
                        >
                          <span className="text-sm text-grey-darker">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Tasks */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-grey-darker mb-2">Recent Tasks</h4>
                    <div className="space-y-2">
                      {project.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex justify-between items-center bg-grey-lighter/10 rounded p-2"
                        >
                          <span className="text-sm text-grey-darker">{task.title}</span>
                          <span className={`text-sm px-2 py-1 rounded
                            ${task.status === 'completed' ? 'bg-blue-lighter/10 text-blue-darker' :
                              task.status === 'in_progress' ? 'bg-osb-light/10 text-osb-dark' :
                              'bg-grey-lighter/20 text-grey-darker'}`}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="planning">
            <div className="text-center py-8 text-grey-lighter">
              No projects in planning phase
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="text-center py-8 text-grey-lighter">
              No completed projects
            </div>
          </TabsContent>
        </TabsRoot>
      </div>
    </Card>
  );
} 