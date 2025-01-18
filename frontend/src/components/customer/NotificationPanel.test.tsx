import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationPanel } from './NotificationPanel';
import { CustomerDashboardService } from '@/lib/services/customer/CustomerDashboardService';

// Mock the CustomerDashboardService
jest.mock('@/lib/services/customer/CustomerDashboardService', () => ({
  getInstance: jest.fn(() => ({
    getRecentNotifications: jest.fn()
  }))
}));

describe('NotificationPanel', () => {
  const mockNotifications = [
    {
      id: '1',
      type: 'info' as const,
      title: 'New Feature',
      message: 'Check out our new dashboard features',
      timestamp: '2025-01-11T10:00:00Z',
      isRead: false,
      link: '/features'
    },
    {
      id: '2',
      type: 'success' as const,
      title: 'Order Confirmed',
      message: 'Your order #123 has been confirmed',
      timestamp: '2025-01-11T09:00:00Z',
      isRead: true,
      link: '/orders/123'
    },
    {
      id: '3',
      type: 'warning' as const,
      title: 'Low Stock Alert',
      message: 'Some items in your cart are running low',
      timestamp: '2025-01-11T08:00:00Z',
      isRead: false
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    render(<NotificationPanel />);
    expect(screen.getByTestId('notification-loading')).toBeInTheDocument();
  });

  it('should render notifications when loaded', async () => {
    const mockService = CustomerDashboardService.getInstance();
    (mockService.getRecentNotifications as jest.Mock).mockResolvedValue(mockNotifications);

    render(<NotificationPanel />);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    expect(screen.getByText('New Feature')).toBeInTheDocument();
    expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
  });

  it('should apply correct styles based on read status', async () => {
    const mockService = CustomerDashboardService.getInstance();
    (mockService.getRecentNotifications as jest.Mock).mockResolvedValue(mockNotifications);

    render(<NotificationPanel />);

    await waitFor(() => {
      const unreadNotification = screen.getByText('New Feature').closest('div');
      const readNotification = screen.getByText('Order Confirmed').closest('div');
      
      expect(unreadNotification).toHaveClass('bg-blue-50');
      expect(readNotification).toHaveClass('bg-white');
    });
  });

  it('should display correct notification icons', async () => {
    const mockService = CustomerDashboardService.getInstance();
    (mockService.getRecentNotifications as jest.Mock).mockResolvedValue(mockNotifications);

    render(<NotificationPanel />);

    await waitFor(() => {
      const infoIcon = screen.getByTestId('info-icon');
      const successIcon = screen.getByTestId('success-icon');
      const warningIcon = screen.getByTestId('warning-icon');

      expect(infoIcon).toHaveClass('text-blue-400');
      expect(successIcon).toHaveClass('text-green-400');
      expect(warningIcon).toHaveClass('text-yellow-400');
    });
  });

  it('should handle error state gracefully', async () => {
    const mockService = CustomerDashboardService.getInstance();
    (mockService.getRecentNotifications as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    render(<NotificationPanel />);

    await waitFor(() => {
      expect(screen.getByText('Error fetching notifications:')).toBeInTheDocument();
    });
  });

  it('should render "View details" link when link is provided', async () => {
    const mockService = CustomerDashboardService.getInstance();
    (mockService.getRecentNotifications as jest.Mock).mockResolvedValue(mockNotifications);

    render(<NotificationPanel />);

    await waitFor(() => {
      const detailsLinks = screen.getAllByText('View details');
      expect(detailsLinks).toHaveLength(2); // Only two notifications have links
    });
  });

  it('should format timestamps correctly', async () => {
    const mockService = CustomerDashboardService.getInstance();
    (mockService.getRecentNotifications as jest.Mock).mockResolvedValue(mockNotifications);

    render(<NotificationPanel />);

    await waitFor(() => {
      const timestamps = screen.getAllByText(/ago$/);
      expect(timestamps).toHaveLength(3);
    });
  });

  it('should handle "Mark all as read" button click', async () => {
    const mockService = CustomerDashboardService.getInstance();
    (mockService.getRecentNotifications as jest.Mock).mockResolvedValue(mockNotifications);

    render(<NotificationPanel />);

    await waitFor(() => {
      const markAllButton = screen.getByText('Mark all as read');
      fireEvent.click(markAllButton);
      // Add assertions for marking all as read functionality once implemented
    });
  });
}); 