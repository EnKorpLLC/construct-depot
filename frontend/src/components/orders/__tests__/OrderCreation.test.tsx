import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderCreation } from '../OrderCreation';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('OrderCreation', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn()
  };

  const mockSearchParams = {
    get: jest.fn()
  };

  const mockProducts = {
    products: [
      {
        id: '1',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        minOrderQuantity: 10,
        unit: 'units'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProducts)
    });
  });

  it('renders loading state initially', () => {
    render(<OrderCreation />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('loads and displays products', async () => {
    render(<OrderCreation />);
    await waitFor(() => {
      expect(screen.getByText(/Test Product/)).toBeInTheDocument();
    });
  });

  it('handles product selection', async () => {
    render(<OrderCreation />);
    await waitFor(() => {
      expect(screen.getByText(/Test Product/)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    expect(screen.getByText('Quantity (units)')).toBeInTheDocument();
  });

  it('shows pool expiry input for pool orders', async () => {
    mockSearchParams.get.mockReturnValue('pool');
    render(<OrderCreation />);
    
    await waitFor(() => {
      expect(screen.getByText(/Test Product/)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    expect(screen.getByText('Pool Expiry')).toBeInTheDocument();
  });

  it('handles order creation submission', async () => {
    render(<OrderCreation />);
    
    await waitFor(() => {
      expect(screen.getByText(/Test Product/)).toBeInTheDocument();
    });

    // Select product
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    // Set quantity
    const quantityInput = screen.getByRole('spinbutton');
    fireEvent.change(quantityInput, { target: { value: '15' } });

    // Add notes
    const notesInput = screen.getByPlaceholderText(/special instructions/);
    fireEvent.change(notesInput, { target: { value: 'Test notes' } });

    // Mock successful order creation
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '123' })
    });

    // Submit order
    const submitButton = screen.getByRole('button', { name: /Create Order/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/orders/123');
    });
  });

  it('handles error during order creation', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<OrderCreation />);
    
    await waitFor(() => {
      expect(screen.getByText(/Test Product/)).toBeInTheDocument();
    });

    // Select product
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    // Mock failed order creation
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to create order'));

    // Submit order
    const submitButton = screen.getByRole('button', { name: /Create Order/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Failed to create order. Please try again.');
    });

    consoleSpy.mockRestore();
    alertMock.mockRestore();
  });
}); 