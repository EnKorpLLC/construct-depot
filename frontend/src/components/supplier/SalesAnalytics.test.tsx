import { render, screen, fireEvent, waitFor } from '@/lib/test-utils';
import { SalesAnalytics } from './SalesAnalytics';
import { mockSession, mockApiResponse } from '@/lib/test-utils';

// Mock fetch
global.fetch = jest.fn();

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: () => null
}));

// Mock data
const mockSalesData = {
  labels: ['Jan 1', 'Jan 2', 'Jan 3'],
  revenue: [1000, 1500, 2000],
  orders: [5, 7, 10],
  averageOrderValue: 250,
  topProducts: [
    {
      name: 'Product A',
      revenue: 2000,
      quantity: 10
    },
    {
      name: 'Product B',
      revenue: 1500,
      quantity: 5
    }
  ]
};

describe('SalesAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() =>
      mockApiResponse(mockSalesData)
    );
  });

  it('renders loading state initially', () => {
    render(<SalesAnalytics />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders sales metrics after loading', async () => {
    render(<SalesAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText('$4,500')).toBeInTheDocument(); // Total Revenue
      expect(screen.getByText('22')).toBeInTheDocument(); // Total Orders
      expect(screen.getByText('$250')).toBeInTheDocument(); // Avg Order Value
    });
  });

  it('changes timeframe when selector is used', async () => {
    render(<SalesAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('$4,500')).toBeInTheDocument();
    });

    // Change timeframe to week
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'week' }
    });

    // Verify new API call was made
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('timeframe=week')
    );
  });

  it('displays top products correctly', async () => {
    render(<SalesAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
      expect(screen.getByText('$2,000')).toBeInTheDocument();
      expect(screen.getByText('10 units sold')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    render(<SalesAnalytics />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('formats currency values correctly', async () => {
    render(<SalesAnalytics />);

    await waitFor(() => {
      const revenue = screen.getByText('$4,500');
      expect(revenue).toBeInTheDocument();
      expect(revenue.textContent).toMatch(/^\$[\d,]+$/);
    });
  });

  it('updates chart when timeframe changes', async () => {
    const { container } = render(<SalesAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('$4,500')).toBeInTheDocument();
    });

    // Change timeframe to year
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'year' }
    });

    // Verify chart container exists
    expect(container.querySelector('.h-64')).toBeInTheDocument();
  });
}); 