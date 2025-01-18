'use client';

import { useState, useEffect } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ProjectOverviewWidget from '@/components/customer/ProjectOverviewWidget';
import BudgetTrackingWidget from '@/components/customer/BudgetTrackingWidget';
import TimelineWidget from '@/components/customer/TimelineWidget';
import CommunicationHubWidget from '@/components/customer/CommunicationHubWidget';
import CustomerDashboardService from '@/services/customer/dashboardService';

export default function CustomerDashboard() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        const projects = await CustomerDashboardService.getProjects();
        if (projects.length > 0) {
          setSelectedProjectId(projects[0].id);
        }
        setError(null);
      } catch (err) {
        setError('Failed to initialize dashboard. Please try again later.');
        console.error('Error initializing dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-screen">
            <div className="text-red-600">{error}</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Dashboard
          </h1>
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Start New Project
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Contact Support
            </button>
          </div>
        </div>

        {selectedProjectId ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Overview Section */}
            <div className="lg:col-span-2">
              <ProjectOverviewWidget />
            </div>

            {/* Budget Tracking Section */}
            <div className="lg:col-span-1">
              <BudgetTrackingWidget projectId={selectedProjectId} />
            </div>

            {/* Timeline Section */}
            <div className="lg:col-span-1">
              <TimelineWidget projectId={selectedProjectId} />
            </div>

            {/* Communication Hub Section */}
            <div className="lg:col-span-2">
              <CommunicationHubWidget />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">No projects found. Start a new project to begin.</div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 