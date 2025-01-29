import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectOverviewWidget from '../ProjectOverviewWidget';
import CustomerDashboardService from '@/services/customer/dashboardService';
import webSocketService from '@/services/websocket/WebSocketService';

// Mock the services
jest.mock('@/services/customer/dashboardService');
jest.mock('@/services/websocket/WebSocketService');

describe('ProjectOverviewWidget', () => {
  const mockProjects = [
    {
      id: '1',
      name: 'Test Project',
      status: 'in_progress',
      progress: 50,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      budget: 100000,
      spent: 50000,
      contractor: {
        name: 'Test Contractor',
        rating: 4.5,
        contact: 'test@example.com',
      },
      team: [
        { name: 'John Doe', role: 'Project Manager' },
      ],
      documents: [
        { name: 'Test Doc', type: 'PDF', lastUpdated: new Date('2024-01-15') },
      ],
      nextMilestone: {
        name: 'Test Milestone',
        dueDate: new Date('2024-02-15'),
      },
    },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock the service methods
    (CustomerDashboardService.getProjects as jest.Mock).mockResolvedValue(mockProjects);
  });

  it('renders loading state initially', () => {
    render(<ProjectOverviewWidget />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders projects after loading', async () => {
    render(<ProjectOverviewWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test Contractor')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (CustomerDashboardService.getProjects as jest.Mock).mockRejectedValue(new Error('Failed to load'));
    
    render(<ProjectOverviewWidget />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load projects/i)).toBeInTheDocument();
    });
  });

  it('updates project data when receiving WebSocket message', async () => {
    render(<ProjectOverviewWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    const updatedProject = {
      ...mockProjects[0],
      progress: 75,
    };

    // Simulate WebSocket message
    act(() => {
      const wsCallback = (webSocketService.subscribe as jest.Mock).mock.calls[0][1];
      wsCallback(updatedProject);
    });

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('handles document upload', async () => {
    render(<ProjectOverviewWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    const newDocument = {
      projectId: '1',
      document: {
        name: 'New Document',
        type: 'PDF',
        lastUpdated: new Date(),
      },
    };

    // Simulate WebSocket message for new document
    act(() => {
      const wsCallback = (webSocketService.subscribe as jest.Mock).mock.calls[1][1];
      wsCallback(newDocument);
    });

    expect(screen.getByText('New Document')).toBeInTheDocument();
  });

  it('handles milestone updates', async () => {
    render(<ProjectOverviewWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    const newMilestone = {
      projectId: '1',
      milestone: {
        name: 'Updated Milestone',
        dueDate: new Date(),
      },
    };

    // Simulate WebSocket message for milestone update
    act(() => {
      const wsCallback = (webSocketService.subscribe as jest.Mock).mock.calls[2][1];
      wsCallback(newMilestone);
    });

    expect(screen.getByText('Updated Milestone')).toBeInTheDocument();
  });
}); 