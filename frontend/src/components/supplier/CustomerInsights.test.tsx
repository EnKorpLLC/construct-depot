import { render, screen, fireEvent, waitFor } from '@/lib/test-utils';
import { CustomerInsights } from './CustomerInsights';
import { mockSession, mockApiResponse } from '@/lib/test-utils';

// Mock fetch
global.fetch = jest.fn();

// Mock data
const mockCustomerData = {
  totalCustomers: 100,
  newCustomers: 15,
  repeatCustomers: 75,
  averageCustomerValue: 500,
  topCustomers: [
    {
      id: 'customer-1',
      name: 'John Doe',
      totalSpent: 5000,
      orderCount: 10,
      lastOrder: '2025-01-11T14:30:00Z',
      status: 'active'
    },
    {
      id: 'customer-2',
      name: 'Jane Smith',
      totalSpent: 3000,
      orderCount: 6,
      lastOrder: '2025-01-11T13:00:00Z',
      status: 'active'
    }
  ],
  customerSegments: [
    {
      name: 'High Value',
      count: 20,
      percentage: 20
    },
    {
      name: 'Regular',
      count: 50,
      percentage: 50
    },
    {
      name: 'Occasional',
      count: 30,
      percentage: 30
    }
  ]
};

describe('CustomerInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() =>
      mockApiResponse(mockCustomerData)
    );
  });

  it('renders loading state initially', () => {
    render(<CustomerInsights />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders customer metrics after loading', async () => {
    render(<CustomerInsights />);
    
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // Total Customers
      expect(screen.getByText('+15 new this month')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument(); // Repeat Customers
    });
  });

  it('switches between overview and customers view', async () => {
    render(<CustomerInsights />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    // Switch to customers view
    fireEvent.click(screen.getByText('Top Customers'));

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Switch back to overview
    fireEvent.click(screen.getByText('Overview'));

    expect(screen.getByText('Customer Segments')).toBeInTheDocument();
  });

  it('displays customer segments correctly', async () => {
    render(<CustomerInsights />);

    await waitFor(() => {
      expect(screen.getByText('High Value')).toBeInTheDocument();
      expect(screen.getByText('20 customers (20%)')).toBeInTheDocument();
      expect(screen.getByText('Regular')).toBeInTheDocument();
      expect(screen.getByText('50 customers (50%)')).toBeInTheDocument();
    });
  });

  it('displays top customers with correct information', async () => {
    render(<CustomerInsights />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Top Customers'));

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('10 orders')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    render(<CustomerInsights />);

    await waitFor(() => {
      expect(screen.getByText(/unable to load customer insights/i)).toBeInTheDocument();
    });
  });

  it('shows correct status badges for customers', async () => {
    render(<CustomerInsights />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Top Customers'));

    const activeStatus = screen.getAllByText('active')[0];
    expect(activeStatus).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('calculates retention rate correctly', async () => {
    render(<CustomerInsights />);

    await waitFor(() => {
      const retention = screen.getByText('75.0% retention');
      expect(retention).toBeInTheDocument();
    });
  });
}); 