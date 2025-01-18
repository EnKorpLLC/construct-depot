import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BudgetTrackingWidget from '../BudgetTrackingWidget';
import CustomerDashboardService from '@/services/customer/dashboardService';
import webSocketService from '@/services/websocket/WebSocketService';

// Mock the services
jest.mock('@/services/customer/dashboardService');
jest.mock('@/services/websocket/WebSocketService');

describe('BudgetTrackingWidget', () => {
  const projectId = 'test-project-1';
  
  const mockCategories = [
    {
      name: 'Materials',
      allocated: 75000,
      spent: 45000,
      remaining: 30000,
      status: 'on_track' as const,
    },
    {
      name: 'Labor',
      allocated: 50000,
      spent: 35000,
      remaining: 15000,
      status: 'warning' as const,
    },
  ];

  const mockSummary = {
    totalBudget: 150000,
    totalSpent: 108000,
    totalRemaining: 42000,
    projectedOverage: 8000,
    recentExpenses: 17000,
    pendingApprovals: 5000,
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock the service methods
    (CustomerDashboardService.getBudgetCategories as jest.Mock).mockResolvedValue(mockCategories);
    (CustomerDashboardService.getBudgetSummary as jest.Mock).mockResolvedValue(mockSummary);
  });

  it('renders loading state initially', () => {
    render(<BudgetTrackingWidget projectId={projectId} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders budget data after loading', async () => {
    render(<BudgetTrackingWidget projectId={projectId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Materials')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Labor')).toBeInTheDocument();
    expect(screen.getByText('$150k')).toBeInTheDocument();
    expect(screen.getByText('$42k remaining')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (CustomerDashboardService.getBudgetCategories as jest.Mock).mockRejectedValue(new Error('Failed to load'));
    
    render(<BudgetTrackingWidget projectId={projectId} />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load budget data/i)).toBeInTheDocument();
    });
  });

  it('updates category data when receiving WebSocket message', async () => {
    render(<BudgetTrackingWidget projectId={projectId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Materials')).toBeInTheDocument();
    });

    const updatedCategory = {
      projectId,
      category: {
        ...mockCategories[0],
        spent: 50000,
        remaining: 25000,
      },
    };

    // Simulate WebSocket message
    act(() => {
      const wsCallback = (webSocketService.subscribe as jest.Mock).mock.calls[0][1];
      wsCallback(updatedCategory);
    });

    expect(screen.getByText('$50,000')).toBeInTheDocument();
  });

  it('updates budget summary when receiving WebSocket message', async () => {
    render(<BudgetTrackingWidget projectId={projectId} />);
    
    await waitFor(() => {
      expect(screen.getByText('$150k')).toBeInTheDocument();
    });

    const updatedSummary = {
      projectId,
      summaryData: {
        ...mockSummary,
        totalSpent: 120000,
        totalRemaining: 30000,
      },
    };

    // Simulate WebSocket message
    act(() => {
      const wsCallback = (webSocketService.subscribe as jest.Mock).mock.calls[2][1];
      wsCallback(updatedSummary);
    });

    expect(screen.getByText('$30k remaining')).toBeInTheDocument();
  });

  it('handles new expense addition', async () => {
    render(<BudgetTrackingWidget projectId={projectId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Materials')).toBeInTheDocument();
    });

    const newExpense = {
      projectId,
      expense: {
        id: 'exp-1',
        date: new Date(),
        category: 'Materials',
        description: 'New Materials',
        amount: 5000,
        status: 'pending' as const,
      },
    };

    // Simulate WebSocket message
    act(() => {
      const wsCallback = (webSocketService.subscribe as jest.Mock).mock.calls[1][1];
      wsCallback(newExpense);
    });

    expect(screen.getByText('New Materials')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });
}); 