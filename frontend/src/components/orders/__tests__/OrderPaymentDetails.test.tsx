import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderPaymentDetails } from '../OrderPaymentDetails';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@/types/order';

// Mock fetch globally
global.fetch = jest.fn();

const mockOrderId = '123';
const mockPayment = {
  status: PaymentStatus.PENDING,
  method: PaymentMethod.CREDIT_CARD,
  amount: 1000
};

describe('OrderPaymentDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: jest.fn() },
    });
  });

  it('renders payment information when payment exists', () => {
    render(
      <OrderPaymentDetails
        orderId={mockOrderId}
        payment={mockPayment}
        orderStatus={OrderStatus.PENDING}
      />
    );

    expect(screen.getByText('Payment Status')).toBeInTheDocument();
    expect(screen.getByText(mockPayment.status)).toBeInTheDocument();
    expect(screen.getByText(mockPayment.method)).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  it('shows payment form for pending orders without payment', () => {
    render(
      <OrderPaymentDetails
        orderId={mockOrderId}
        payment={null}
        orderStatus={OrderStatus.PENDING}
      />
    );

    expect(screen.getByText('Payment Information')).toBeInTheDocument();
    expect(screen.getByText('Payment Method')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('**** **** **** ****')).toBeInTheDocument();
  });

  it('shows message for non-pending orders', () => {
    render(
      <OrderPaymentDetails
        orderId={mockOrderId}
        payment={null}
        orderStatus={OrderStatus.COMPLETED}
      />
    );

    expect(screen.getByText(/Payment is not available for orders in COMPLETED status/)).toBeInTheDocument();
  });

  it('validates credit card details before submission', async () => {
    render(
      <OrderPaymentDetails
        orderId={mockOrderId}
        payment={null}
        orderStatus={OrderStatus.PENDING}
      />
    );

    // Mock window.alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Try to submit with empty fields
    fireEvent.click(screen.getByText('Process Payment'));
    expect(alertMock).toHaveBeenCalledWith('Please enter a valid card number');

    // Fill invalid card number
    fireEvent.change(screen.getByPlaceholderText('**** **** **** ****'), {
      target: { value: '1234' },
    });
    fireEvent.click(screen.getByText('Process Payment'));
    expect(alertMock).toHaveBeenCalledWith('Please enter a valid card number');

    alertMock.mockRestore();
  });

  it('formats card number correctly', () => {
    render(
      <OrderPaymentDetails
        orderId={mockOrderId}
        payment={null}
        orderStatus={OrderStatus.PENDING}
      />
    );

    const input = screen.getByPlaceholderText('**** **** **** ****');
    fireEvent.change(input, { target: { value: '4111111111111111' } });
    expect(input.value).toBe('4111 1111 1111 1111');
  });

  it('handles successful payment submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success' }),
    });

    render(
      <OrderPaymentDetails
        orderId={mockOrderId}
        payment={null}
        orderStatus={OrderStatus.PENDING}
      />
    );

    // Fill in payment details
    fireEvent.change(screen.getByPlaceholderText('**** **** **** ****'), {
      target: { value: '4111111111111111' },
    });
    fireEvent.change(screen.getByPlaceholderText('MM'), {
      target: { value: '12' },
    });
    fireEvent.change(screen.getByPlaceholderText('YY'), {
      target: { value: '25' },
    });
    fireEvent.change(screen.getByPlaceholderText('***'), {
      target: { value: '123' },
    });

    fireEvent.click(screen.getByText('Process Payment'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/orders/${mockOrderId}/payment`,
        expect.any(Object)
      );
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  it('handles payment submission failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Payment failed'));

    render(
      <OrderPaymentDetails
        orderId={mockOrderId}
        payment={null}
        orderStatus={OrderStatus.PENDING}
      />
    );

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Fill in payment details
    fireEvent.change(screen.getByPlaceholderText('**** **** **** ****'), {
      target: { value: '4111111111111111' },
    });
    fireEvent.change(screen.getByPlaceholderText('MM'), {
      target: { value: '12' },
    });
    fireEvent.change(screen.getByPlaceholderText('YY'), {
      target: { value: '25' },
    });
    fireEvent.change(screen.getByPlaceholderText('***'), {
      target: { value: '123' },
    });

    fireEvent.click(screen.getByText('Process Payment'));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Payment failed. Please try again.');
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
    alertMock.mockRestore();
  });

  it('displays correct payment status colors', () => {
    const paymentStatuses = [
      { status: PaymentStatus.PENDING, expectedColor: 'bg-yellow-500' },
      { status: PaymentStatus.AUTHORIZED, expectedColor: 'bg-blue-500' },
      { status: PaymentStatus.CAPTURED, expectedColor: 'bg-green-500' },
      { status: PaymentStatus.FAILED, expectedColor: 'bg-red-500' },
      { status: PaymentStatus.REFUNDED, expectedColor: 'bg-orange-500' },
    ];

    paymentStatuses.forEach(({ status, expectedColor }) => {
      const { container } = render(
        <OrderPaymentDetails
          orderId={mockOrderId}
          payment={{ ...mockPayment, status }}
          orderStatus={OrderStatus.PENDING}
        />
      );

      const badge = container.querySelector(`.${expectedColor}`);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(status);
    });
  });

  it('shows bank transfer instructions when selected', () => {
    render(
      <OrderPaymentDetails
        orderId={mockOrderId}
        payment={null}
        orderStatus={OrderStatus.PENDING}
      />
    );

    // Change payment method to bank transfer
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Bank Transfer'));

    expect(screen.getByText('Bank Transfer Instructions')).toBeInTheDocument();
    expect(screen.getByText(/Please transfer the payment to the following account/)).toBeInTheDocument();
    expect(screen.getByText(`Reference: ${mockOrderId}`)).toBeInTheDocument();
  });
}); 