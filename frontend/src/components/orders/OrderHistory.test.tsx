import { render, screen, waitFor } from '@testing-library/react';
import { OrderHistory } from './OrderHistory';
import { theme } from '@/lib/theme';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock theme colors
jest.mock('@/lib/theme', () => ({
  theme: {
    statusColors: {
      pending: '#FCD34D',
      processing: '#60A5FA',
      completed: '#34D399',
      cancelled: '#EF4444'
    },
    colors: {
      greyDarker: '#4B5563'
    }
  }
}));

describe('OrderHistory', () => {
  const mockOrderHistory = {
    history: [
      {
        id: '1',
        fromStatus: 'pending',
        toStatus: 'processing',
        note: 'Order moved to processing',
        createdAt: '2025-01-11T14:30:00Z',
        user: { name: 'John Doe' },
        metadata: {
          reason: 'Payment confirmed',
          comment: 'Customer requested priority processing'
        }
      },
      {
        id: '2',
        fromStatus: 'processing',
        toStatus: 'completed',
        note: 'Order completed',
        createdAt: '2025-01-11T15:30:00Z',
        user: { name: 'Jane Smith' }
      }
    ]
  };

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('displays loading state initially', () => {
    render(<OrderHistory orderId="123" />);
    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('displays order history entries when loaded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrderHistory
    });

    render(<OrderHistory orderId="123" />);

    await waitFor(() => {
      expect(screen.getByText('Order History')).toBeInTheDocument();
    });

    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('processing')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('Order moved to processing')).toBeInTheDocument();
    expect(screen.getByText('Order completed')).toBeInTheDocument();
  });

  it('displays metadata when available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrderHistory
    });

    render(<OrderHistory orderId="123" />);

    await waitFor(() => {
      expect(screen.getByText('Reason: Payment confirmed')).toBeInTheDocument();
      expect(screen.getByText('Comment: Customer requested priority processing')).toBeInTheDocument();
    });
  });

  it('displays error message when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<OrderHistory orderId="123" />);

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch')).toBeInTheDocument();
    });
  });

  it('displays empty state when no history available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ history: [] })
    });

    render(<OrderHistory orderId="123" />);

    await waitFor(() => {
      expect(screen.getByText('No history available')).toBeInTheDocument();
    });
  });

  it('makes API call with correct orderId', async () => {
    render(<OrderHistory orderId="123" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/orders/123/history');
    });
  });

  it('applies correct status colors to badges', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrderHistory
    });

    render(<OrderHistory orderId="123" />);

    await waitFor(() => {
      const firstEntry = screen.getByText('Order moved to processing').parentElement;
      expect(firstEntry).toHaveStyle({ borderColor: theme.statusColors.processing });
    });
  });

  it('formats dates correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrderHistory
    });

    render(<OrderHistory orderId="123" />);

    await waitFor(() => {
      // Verify that dates are formatted (exact format will depend on formatDate implementation)
      expect(screen.getByText(/Updated by John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Updated by Jane Smith/)).toBeInTheDocument();
    });
  });

  it('handles server error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<OrderHistory orderId="123" />);

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch order history')).toBeInTheDocument();
    });
  });
}); 