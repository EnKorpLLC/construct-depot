import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationList } from './NotificationList';
import { useSession } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('NotificationList', () => {
  const mockNotifications = [
    {
      id: '1',
      type: 'ORDER_STATUS_CHANGE',
      title: 'Order Status Updated',
      message: 'Your order #123 has been shipped',
      read: false,
      createdAt: '2025-01-11T10:00:00Z',
      metadata: { orderId: '123', status: 'SHIPPED' }
    },
    {
      id: '2',
      type: 'POOL_PROGRESS',
      title: 'Pool Progress Update',
      message: 'Pool #456 is 75% complete',
      read: true,
      createdAt: '2025-01-11T09:00:00Z',
      metadata: {
        progress: 75,
        currentQuantity: 150,
        targetQuantity: 200
      }
    },
    {
      id: '3',
      type: 'POOL_COMPLETE',
      title: 'Pool Complete',
      message: 'Pool #789 has reached its target',
      read: false,
      createdAt: '2025-01-11T08:00:00Z',
      metadata: { poolId: '789' }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: 'user123' } },
      status: 'authenticated'
    });
  });

  it('should show loading state initially', () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));
    render(<NotificationList />);
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('should render notifications when loaded', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockNotifications)
      })
    );

    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText('Order Status Updated')).toBeInTheDocument();
      expect(screen.getByText('Pool Progress Update')).toBeInTheDocument();
      expect(screen.getByText('Pool Complete')).toBeInTheDocument();
    });
  });

  it('should handle pagination correctly', async () => {
    // First page
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockNotifications)
      })
    );

    // Second page
    const secondPageNotifications = [
      {
        id: '4',
        type: 'SYSTEM',
        title: 'System Update',
        message: 'System maintenance scheduled',
        read: false,
        createdAt: '2025-01-11T07:00:00Z'
      }
    ];

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(secondPageNotifications)
      })
    );

    render(<NotificationList limit={3} />);

    await waitFor(() => {
      expect(screen.getByText('Order Status Updated')).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText('System Update')).toBeInTheDocument();
    });
  });

  it('should display correct icons for different notification types', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockNotifications)
      })
    );

    render(<NotificationList />);

    await waitFor(() => {
      const orderIcon = screen.getByText('📦');
      const poolProgressIcon = screen.getByText('📊');
      const poolCompleteIcon = screen.getByText('✅');

      expect(orderIcon).toBeInTheDocument();
      expect(poolProgressIcon).toBeInTheDocument();
      expect(poolCompleteIcon).toBeInTheDocument();
    });
  });

  it('should handle marking notifications as read', async () => {
    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockNotifications)
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        })
      );

    render(<NotificationList />);

    await waitFor(() => {
      const markAsReadButton = screen.getAllByText('Mark as read')[0];
      fireEvent.click(markAsReadButton);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/notifications/mark-read', expect.any(Object));
  });

  it('should display progress bar for POOL_PROGRESS notifications', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockNotifications)
      })
    );

    render(<NotificationList />);

    await waitFor(() => {
      const progressText = screen.getByText('150 / 200 units');
      expect(progressText).toBeInTheDocument();

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '75%' });
    });
  });

  it('should handle error state gracefully', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500
      })
    );

    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch notifications')).toBeInTheDocument();
    });
  });

  it('should show empty state when no notifications', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    );

    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });
  });
}); 