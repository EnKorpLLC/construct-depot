'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Project } from '@prisma/client';
import { ProjectService } from '@/lib/services/project/ProjectService';
import { formatDistanceToNow } from 'date-fns';

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectService = ProjectService.getInstance();
        const result = await projectService.listProjects({
          limit: 5,
          page: 1
        });
        setProjects(result.projects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-3">
            <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/customer/projects/${project.id}`}
          className="block bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{project.name}</h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(project.startDate), { addSuffix: true })}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getProgressColor(project.progress)} h-2 rounded-full transition-all`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center text-sm text-gray-500">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {project.teamSize} team members
              </span>
            </div>
          </div>
        </Link>
      ))}

      <Link
        href="/customer/projects"
        className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-4"
      >
        View All Projects →
      </Link>
    </div>
  );
} 