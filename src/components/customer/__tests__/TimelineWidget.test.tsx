import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimelineWidget from '../TimelineWidget';
import CustomerDashboardService from '@/services/customer/dashboardService';
import webSocketService from '@/services/websocket/WebSocketService';

// Mock the services
jest.mock('@/services/customer/dashboardService');
jest.mock('@/services/websocket/WebSocketService');

describe('TimelineWidget', () => {
  const projectId = 'test-project-1';
  
  const mockEvents = [
    {
      id: '1',
      title: 'Project Planning Phase',
      date: new Date('2024-01-15'),
      type: 'milestone' as const,
      status: 'completed' as const,
      description: 'Initial project planning and design approval',
      assignees: [
        { name: 'John Doe', role: 'Project Manager' },
      ],
    },
    {
      id: '2',
      title: 'Material Delivery',
      date: new Date('2024-02-01'),
      type: 'delivery' as const,
      status: 'in_progress' as const,
      description: 'Delivery of main construction materials',
      notes: 'Awaiting final shipment',
    },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock the service methods
    (CustomerDashboardService.getTimelineEvents as jest.Mock).mockResolvedValue(mockEvents);
  });

  it('renders loading state initially', () => {
    render(<TimelineWidget projectId={projectId} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders timeline events after loading', async () => {
    render(<TimelineWidget projectId={projectId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Project Planning Phase')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Material Delivery')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Awaiting final shipment')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (CustomerDashboardService.getTimelineEvents as jest.Mock).mockRejectedValue(new Error('Failed to load'));
    
    render(<TimelineWidget projectId={projectId} />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load timeline events/i)).toBeInTheDocument();
    });
  });

  it('adds new timeline event when receiving WebSocket message', async () => {
    render(<TimelineWidget projectId={projectId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Project Planning Phase')).toBeInTheDocument();
    });

    const newEvent = {
      projectId,
      id: '3',
      title: 'New Milestone',
      date: new Date(),
      type: 'milestone' as const,
      status: 'upcoming' as const,
      description: 'New milestone description',
    };

    // Simulate WebSocket message
    act(() => {
      const wsCallback = (webSocketService.subscribe as jest.Mock).mock.calls[0][1];
      wsCallback(newEvent);
    });

    expect(screen.getByText('New Milestone')).toBeInTheDocument();
    expect(screen.getByText('New milestone description')).toBeInTheDocument();
  });

  it('updates existing timeline event when receiving WebSocket message', async () => {
    render(<TimelineWidget projectId={projectId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Project Planning Phase')).toBeInTheDocument();
    });

    const updatedEvent = {
      projectId,
      id: '1',
      updates: {
        status: 'delayed' as const,
        notes: 'Delayed due to weather',
      },
    };

    // Simulate WebSocket message
    act(() => {
      const wsCallback = (webSocketService.subscribe as jest.Mock).mock.calls[1][1];
      wsCallback(updatedEvent);
    });

    expect(screen.getByText('DELAYED')).toBeInTheDocument();
    expect(screen.getByText('Delayed due to weather')).toBeInTheDocument();
  });

  it('removes timeline event when receiving delete WebSocket message', async () => {
    render(<TimelineWidget projectId={projectId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Project Planning Phase')).toBeInTheDocument();
    });

    const deleteEvent = {
      projectId,
      id: '1',
    };

    // Simulate WebSocket message
    act(() => {
      const wsCallback = (webSocketService.subscribe as jest.Mock).mock.calls[2][1];
      wsCallback(deleteEvent);
    });

    expect(screen.queryByText('Project Planning Phase')).not.toBeInTheDocument();
  });

  it('filters events by project ID', async () => {
    render(<TimelineWidget projectId={projectId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Project Planning Phase')).toBeInTheDocument();
    });

    const differentProjectEvent = {
      projectId: 'different-project',
      id: '3',
      title: 'Different Project Event',
      date: new Date(),
      type: 'milestone' as const,
      status: 'upcoming' as const,
    };

    // Simulate WebSocket message
    act(() => {
      const wsCallback = (webSocketService.subscribe as jest.Mock).mock.calls[0][1];
      wsCallback(differentProjectEvent);
    });

    expect(screen.queryByText('Different Project Event')).not.toBeInTheDocument();
  });
}); 