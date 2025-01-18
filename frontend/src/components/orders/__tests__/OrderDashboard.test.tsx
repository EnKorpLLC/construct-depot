import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderDashboard } from '../OrderDashboard';
import { useRouter } from 'next/navigation';
import { OrderStatus } from '@prisma/client';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('OrderDashboard', () => {
  const mockRouter = {
    push: jest.fn()
  };

  const mockMetrics = {
    totalOrders: 100,
    totalValue: 10000,
    averageOrderValue: 100,
    ordersByStatus: {
      DRAFT: 10,
      POOLING: 20,
      PENDING: 30,
      CONFIRMED: 15,
      PROCESSING: 10,
      SHIPPED: 5,
      DELIVERED: 5,
      CANCELLED: 3,
      REFUNDED: 2
    },
    poolingOrders: 20,
    poolSuccessRate: 0.85
  };

  const mockOrders = {
    orders: [
      {
        id: '1',
        orderNumber: 'ORDER-001',
        status: 'PENDING' as OrderStatus,
        totalAmount: 500,
        createdAt: '2025-01-11T08:15:00Z',
        items: [
          {
            productId: '1',
            quantity: 50,
            product: {
              name: 'Test Product'
            }
          }
        ]
      },
      {
        id: '2',
        orderNumber: 'POOL-001',
        status: 'POOLING' as OrderStatus,
        totalAmount: 1000,
        createdAt: '2025-01-11T08:15:00Z',
        items: [
          {
            productId: '2',
            quantity: 100,
            product: {
              name: 'Pool Product'
            }
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock)
      .mockImplementation((url) => {
        if (url.includes('metrics')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockMetrics)
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOrders)
        });
      });
  });

  it('renders loading state initially', () => {
    render(<OrderDashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays metrics after loading', async () => {
    render(<OrderDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // Total Orders
      expect(screen.getByText('$10,000.00')).toBeInTheDocument(); // Total Value
      expect(screen.getByText('$100.00')).toBeInTheDocument(); // Average Order Value
    });
  });

  it('displays orders by status with progress bars', async () => {
    render(<OrderDashboard />);
    
    await waitFor(() => {
      Object.entries(mockMetrics.ordersByStatus).forEach(([status, count]) => {
        expect(screen.getByText(status)).toBeInTheDocument();
        expect(screen.getByText(count.toString())).toBeInTheDocument();
      });
    });
  });

  it('displays pool statistics', async () => {
    render(<OrderDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('20')).toBeInTheDocument(); // Active Pools
      expect(screen.getByText('85.0%')).toBeInTheDocument(); // Pool Success Rate
    });
  });

  it('switches between tabs', async () => {
    render(<OrderDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Switch to Recent Orders tab
    fireEvent.click(screen.getByRole('tab', { name: /Recent Orders/i }));
    expect(screen.getByText('ORDER-001')).toBeInTheDocument();

    // Switch to Active Pools tab
    fireEvent.click(screen.getByRole('tab', { name: /Active Pools/i }));
    expect(screen.getByText('POOL-001')).toBeInTheDocument();
  });

  it('navigates to order details when clicking an order', async () => {
    render(<OrderDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Switch to Recent Orders tab
    fireEvent.click(screen.getByRole('tab', { name: /Recent Orders/i }));
    
    // Click on an order
    fireEvent.click(screen.getByText('ORDER-001'));
    expect(mockRouter.push).toHaveBeenCalledWith('/orders/1');
  });

  it('navigates to create order page', async () => {
    render(<OrderDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /Create Order/i });
    fireEvent.click(createButton);
    expect(mockRouter.push).toHaveBeenCalledWith('/orders/new');
  });

  it('handles error when fetching dashboard data', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
    
    render(<OrderDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
}); 