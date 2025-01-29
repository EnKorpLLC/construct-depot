import { render, screen, waitFor } from '@/lib/test-utils';
import { InventoryOverview } from './InventoryOverview';
import { mockSession, mockApiResponse } from '@/lib/test-utils';

// Mock fetch
global.fetch = jest.fn();

// Mock data
const mockInventoryData = {
  totalProducts: 50,
  lowStockItems: 5,
  reorderNeeded: 3,
  products: [
    {
      id: 'product-1',
      name: 'Cement',
      sku: 'CEM-001',
      currentStock: 5,
      reorderPoint: 10,
      status: 'low_stock'
    },
    {
      id: 'product-2',
      name: 'Steel Bars',
      sku: 'STL-001',
      currentStock: 100,
      reorderPoint: 20,
      status: 'in_stock'
    },
    {
      id: 'product-3',
      name: 'Bricks',
      sku: 'BRK-001',
      currentStock: 0,
      reorderPoint: 50,
      status: 'out_of_stock'
    }
  ]
};

describe('InventoryOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() =>
      mockApiResponse(mockInventoryData)
    );
  });

  it('renders loading state initially', () => {
    render(<InventoryOverview />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders inventory metrics after loading', async () => {
    render(<InventoryOverview />);
    
    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument(); // Total Products
      expect(screen.getByText('5')).toBeInTheDocument(); // Low Stock Items
      expect(screen.getByText('3')).toBeInTheDocument(); // Reorder Needed
    });
  });

  it('displays product list with correct information', async () => {
    render(<InventoryOverview />);

    await waitFor(() => {
      expect(screen.getByText('Cement')).toBeInTheDocument();
      expect(screen.getByText('CEM-001')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Current Stock
    });
  });

  it('shows correct status indicators', async () => {
    render(<InventoryOverview />);

    await waitFor(() => {
      const lowStockStatus = screen.getByText('low_stock');
      const inStockStatus = screen.getByText('in_stock');
      const outOfStockStatus = screen.getByText('out_of_stock');

      expect(lowStockStatus).toHaveClass('text-yellow-800');
      expect(inStockStatus).toHaveClass('text-green-800');
      expect(outOfStockStatus).toHaveClass('text-red-800');
    });
  });

  it('handles API error gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    render(<InventoryOverview />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('displays reorder points correctly', async () => {
    render(<InventoryOverview />);

    await waitFor(() => {
      expect(screen.getByText('Reorder Point: 10')).toBeInTheDocument();
      expect(screen.getByText('Reorder Point: 20')).toBeInTheDocument();
      expect(screen.getByText('Reorder Point: 50')).toBeInTheDocument();
    });
  });

  it('highlights items below reorder point', async () => {
    render(<InventoryOverview />);

    await waitFor(() => {
      const lowStockItem = screen.getByText('Cement').closest('div');
      expect(lowStockItem).toHaveClass('bg-yellow-50');
    });
  });

  it('displays SKUs in correct format', async () => {
    render(<InventoryOverview />);

    await waitFor(() => {
      const skus = ['CEM-001', 'STL-001', 'BRK-001'];
      skus.forEach(sku => {
        expect(screen.getByText(sku)).toBeInTheDocument();
      });
    });
  });
}); 