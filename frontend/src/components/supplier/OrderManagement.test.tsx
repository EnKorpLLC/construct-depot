import { render, screen, fireEvent, waitFor } from '@/lib/test-utils';
import { OrderManagement } from './OrderManagement';
import { mockSession, mockApiResponse } from '@/lib/test-utils';

// Mock fetch
global.fetch = jest.fn();

// Mock data
const mockOrders = [
  {
    id: 'order-1',
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
    status: 'pending',
    total: 1000,
    items: 5,
    createdAt: '2025-01-11T14:30:00Z'
  },
  {
    id: 'order-2',
    orderNumber: 'ORD-002',
    customerName: 'Jane Smith',
    status: 'processing',
    total: 2000,
    items: 3,
    createdAt: '2025-01-11T14:00:00Z'
  }
];

describe('OrderManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() =>
      mockApiResponse({ orders: mockOrders })
    );
  });

  it('renders loading state initially', () => {
    render(<OrderManagement />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders orders after loading', async () => {
    render(<OrderManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
    });
  });

  it('filters orders by status', async () => {
    render(<OrderManagement />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Change filter to 'processing'
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'processing' }
    });

    await waitFor(() => {
      expect(screen.queryByText('ORD-001')).not.toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
    });
  });

  it('displays order statistics correctly', async () => {
    render(<OrderManagement />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Orders
      expect(screen.getByText('1')).toBeInTheDocument(); // Pending Orders
    });
  });

  it('handles API error gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    render(<OrderManagement />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('displays order details correctly', async () => {
    render(<OrderManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('shows correct status badge colors', async () => {
    render(<OrderManagement />);

    await waitFor(() => {
      const pendingBadge = screen.getByText('Pending');
      const processingBadge = screen.getByText('Processing');
      
      expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
      expect(processingBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  it('handles pagination correctly', async () => {
    const paginatedOrders = {
      orders: mockOrders,
      pagination: {
        total: 50,
        pages: 5,
        current: 1
      }
    };

    (global.fetch as jest.Mock).mockImplementation(() =>
      mockApiResponse(paginatedOrders)
    );

    render(<OrderManagement />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
    });

    // Test next page
    fireEvent.click(screen.getByLabelText('Next page'));
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2')
    );
  });

  it('handles empty order list gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      mockApiResponse({ orders: [] })
    );

    render(<OrderManagement />);

    await waitFor(() => {
      expect(screen.getByText('No orders found')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Total Orders
    });
  });

  it('formats dates correctly for different timezones', async () => {
    render(<OrderManagement />);

    await waitFor(() => {
      const dateElement = screen.getByText(expect.stringMatching(/ago/));
      expect(dateElement).toBeInTheDocument();
    });
  });

  it('maintains filter state after refresh', async () => {
    render(<OrderManagement />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Set filter
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'processing' }
    });

    // Simulate refresh
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      mockApiResponse({ orders: mockOrders })
    );

    // Trigger a refresh
    fireEvent.click(screen.getByLabelText('Refresh'));

    // Verify filter is maintained
    await waitFor(() => {
      expect(screen.queryByText('ORD-001')).not.toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
    });
  });

  it('sorts orders by date correctly', async () => {
    render(<OrderManagement />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Click sort button
    fireEvent.click(screen.getByLabelText('Sort by date'));

    // Verify order
    const orders = screen.getAllByRole('article');
    expect(orders[0]).toHaveTextContent('ORD-002');
    expect(orders[1]).toHaveTextContent('ORD-001');
  });

  it('validates order total format', async () => {
    const ordersWithInvalidTotal = [{
      ...mockOrders[0],
      total: 1000.999 // More than 2 decimal places
    }];

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      mockApiResponse({ orders: ordersWithInvalidTotal })
    );

    render(<OrderManagement />);

    await waitFor(() => {
      expect(screen.getByText('$1,001.00')).toBeInTheDocument(); // Should round to 2 decimals
    });
  });
}); 