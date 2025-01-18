import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PoolManagement } from '../PoolManagement';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('PoolManagement', () => {
  const mockRouter = {
    push: jest.fn()
  };

  const mockPools = {
    pools: [
      {
        id: '1',
        orderNumber: 'POOL-001',
        status: 'POOLING',
        totalAmount: 1000,
        createdAt: '2025-01-11T08:15:00Z',
        poolExpiry: '2025-01-13T08:15:00Z',
        currentQuantity: 50,
        targetQuantity: 100,
        items: [
          {
            productId: '1',
            quantity: 50,
            unitPrice: 20,
            product: {
              name: 'Test Product',
              description: 'Test Description',
              minOrderQuantity: 10
            }
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPools)
    });
  });

  it('renders loading state initially', () => {
    render(<PoolManagement />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays pools after loading', async () => {
    render(<PoolManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('POOL-001')).toBeInTheDocument();
    });
  });

  it('displays empty state when no pools are available', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ pools: [] })
    });

    render(<PoolManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('No active pools found')).toBeInTheDocument();
    });
  });

  it('shows join modal when clicking join pool button', async () => {
    render(<PoolManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    const joinButton = screen.getByRole('button', { name: /Join Pool/i });
    fireEvent.click(joinButton);

    expect(screen.getByText('Join Pool')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(10); // minOrderQuantity
  });

  it('handles successful pool joining', async () => {
    render(<PoolManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Open join modal
    const joinButton = screen.getByRole('button', { name: /Join Pool/i });
    fireEvent.click(joinButton);

    // Set quantity
    const quantityInput = screen.getByRole('spinbutton');
    fireEvent.change(quantityInput, { target: { value: '15' } });

    // Mock successful join
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '123' })
    });

    // Submit join request
    const confirmJoinButton = screen.getByRole('button', { name: /Join Pool$/i });
    fireEvent.click(confirmJoinButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/orders/123');
    });
  });

  it('handles error when joining pool', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<PoolManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Open join modal
    const joinButton = screen.getByRole('button', { name: /Join Pool/i });
    fireEvent.click(joinButton);

    // Mock failed join
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to join pool'));

    // Submit join request
    const confirmJoinButton = screen.getByRole('button', { name: /Join Pool$/i });
    fireEvent.click(confirmJoinButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Failed to join pool. Please try again.');
    });

    consoleSpy.mockRestore();
    alertMock.mockRestore();
  });

  it('calculates and displays pool progress correctly', async () => {
    render(<PoolManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('50 / 100 units')).toBeInTheDocument();
    });

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('displays time remaining correctly', async () => {
    const mockDate = new Date('2025-01-11T08:15:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

    render(<PoolManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('48h 0m remaining')).toBeInTheDocument();
    });
  });
}); 