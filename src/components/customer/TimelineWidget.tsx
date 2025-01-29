'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Users,
  MessageSquare,
  CalendarDays,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import CustomerDashboardService from '@/services/customer/dashboardService';
import useWebSocket from '@/hooks/useWebSocket';

interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  type: 'milestone' | 'task' | 'meeting' | 'inspection' | 'delivery';
  status: 'completed' | 'in_progress' | 'upcoming' | 'delayed';
  description?: string;
  assignees?: Array<{
    name: string;
    role: string;
  }>;
  notes?: string;
}

interface TimelineSummary {
  totalMilestones: number;
  completedMilestones: number;
  upcomingEvents: number;
  delayedItems: number;
  projectProgress: number;
  estimatedCompletion: Date;
}

export default function TimelineWidget({ projectId }: { projectId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimelineEvents = async () => {
      try {
        setLoading(true);
        const data = await CustomerDashboardService.getTimelineEvents(projectId);
        setEvents(data);
        setError(null);
      } catch (err) {
        setError('Failed to load timeline events. Please try again later.');
        console.error('Error loading timeline events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineEvents();
  }, [projectId]);

  // WebSocket subscriptions for real-time updates
  useWebSocket<TimelineEvent>('timeline_event_added', (event) => {
    if (event.projectId === projectId) {
      setEvents(prev => [...prev, event]);
    }
  });

  useWebSocket<{ id: string; projectId: string; updates: Partial<TimelineEvent> }>('timeline_event_updated', (update) => {
    if (update.projectId === projectId) {
      setEvents(prev =>
        prev.map(event =>
          event.id === update.id
            ? { ...event, ...update.updates }
            : event
        )
      );
    }
  });

  useWebSocket<{ id: string; projectId: string }>('timeline_event_deleted', (deletion) => {
    if (deletion.projectId === projectId) {
      setEvents(prev => prev.filter(event => event.id !== deletion.id));
    }
  });

  const handleUpdateEvent = async (eventId: string, updates: Partial<TimelineEvent>) => {
    try {
      await CustomerDashboardService.updateTimelineEvent(projectId, eventId, updates);
      // No need to update state here as it will be handled by WebSocket
    } catch (err) {
      console.error('Error updating timeline event:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Project Timeline</h2>
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
            <h2 className="text-xl font-semibold text-gray-900">Project Timeline</h2>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">{error}</div>
          </div>
        </div>
      </Card>
    );
  }

  const summary: TimelineSummary = {
    totalMilestones: 12,
    completedMilestones: 5,
    upcomingEvents: 4,
    delayedItems: 1,
    projectProgress: 45,
    estimatedCompletion: new Date('2024-04-15'),
  };

  const getStatusIcon = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'delayed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-400" />;
    }
  };

  const getEventTypeColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'milestone':
        return 'bg-purple-100 text-purple-800';
      case 'delivery':
        return 'bg-blue-100 text-blue-800';
      case 'meeting':
        return 'bg-green-100 text-green-800';
      case 'inspection':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Project Timeline</h2>
          <Button variant="outline" size="sm">
            View Full Timeline
          </Button>
        </div>

        {/* Progress Summary */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{summary.projectProgress}%</span>
          </div>
          <Progress value={summary.projectProgress} className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-500">Milestones</div>
              <div className="text-lg font-semibold">
                {summary.completedMilestones}/{summary.totalMilestones}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-500">Upcoming</div>
              <div className="text-lg font-semibold">{summary.upcomingEvents}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-500">Delayed</div>
              <div className="text-lg font-semibold">{summary.delayedItems}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-500">Est. Completion</div>
              <div className="text-lg font-semibold">
                {summary.estimatedCompletion.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Events */}
        <div className="relative">
          <div className="absolute top-0 bottom-0 left-6 w-px bg-gray-200"></div>
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="relative pl-12">
                <div className="absolute left-4 top-1 -translate-x-1/2 bg-white p-1">
                  {getStatusIcon(event.status)}
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <CalendarDays className="h-4 w-4 mr-1" />
                        {event.date.toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                  )}

                  {event.assignees && event.assignees.length > 0 && (
                    <div className="flex items-center mb-3">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-600">
                        {event.assignees.map(a => a.name).join(', ')}
                      </div>
                    </div>
                  )}

                  {event.notes && (
                    <div className="flex items-start space-x-2 text-sm text-gray-500">
                      <MessageSquare className="h-4 w-4 mt-0.5" />
                      <span>{event.notes}</span>
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <Button variant="ghost" size="sm">
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View More Button */}
        <div className="mt-6 text-center">
          <Button variant="outline">
            Load More Events
          </Button>
        </div>
      </div>
    </Card>
  );
} 