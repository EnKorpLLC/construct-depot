import { render, screen, fireEvent } from '@testing-library/react';
import PaymentTrackingWidget from '../PaymentTrackingWidget';

describe('PaymentTrackingWidget', () => {
  it('renders payment tracking header and create invoice button', () => {
    render(<PaymentTrackingWidget />);
    
    expect(screen.getByText('Payment Tracking')).toBeInTheDocument();
    expect(screen.getByText('Create Invoice')).toBeInTheDocument();
  });

  it('displays payment summary cards with correct data', () => {
    render(<PaymentTrackingWidget />);
    
    // Check summary cards
    expect(screen.getByText('$250k')).toBeInTheDocument();
    expect(screen.getByText('Total Received')).toBeInTheDocument();
    
    expect(screen.getByText('$120k')).toBeInTheDocument();
    expect(screen.getByText('Awaiting Payment')).toBeInTheDocument();
    
    expect(screen.getByText('$45k')).toBeInTheDocument();
    expect(screen.getByText('Past Due')).toBeInTheDocument();
  });

  it('shows quick stats with correct information', () => {
    render(<PaymentTrackingWidget />);
    
    expect(screen.getByText('15 days')).toBeInTheDocument();
    expect(screen.getByText('Avg. Payment Time')).toBeInTheDocument();
    
    expect(screen.getByText('3 payments')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    
    expect(screen.getByText('5 received')).toBeInTheDocument();
    expect(screen.getByText('Recent')).toBeInTheDocument();
  });

  it('filters payments based on status selection', () => {
    render(<PaymentTrackingWidget />);
    
    // Initially all payments should be visible
    expect(screen.getByText('Metro Station Electrical')).toBeInTheDocument();
    expect(screen.getByText('Hospital Wing Construction')).toBeInTheDocument();
    expect(screen.getByText('Office Complex Renovation')).toBeInTheDocument();

    // Click on Pending filter
    fireEvent.click(screen.getByText('Pending'));
    
    // Should only show pending payments
    expect(screen.getByText('Metro Station Electrical')).toBeInTheDocument();
    expect(screen.queryByText('Hospital Wing Construction')).not.toBeInTheDocument();
    expect(screen.queryByText('Office Complex Renovation')).not.toBeInTheDocument();
  });

  it('displays correct status badges with appropriate colors', () => {
    const { container } = render(<PaymentTrackingWidget />);
    
    // Check status badges
    const pendingBadge = screen.getByText('PENDING');
    expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    
    const paidBadge = screen.getByText('PAID');
    expect(paidBadge).toHaveClass('bg-green-100', 'text-green-800');
    
    const overdueBadge = screen.getByText('OVERDUE');
    expect(overdueBadge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('shows payment details for each payment', () => {
    render(<PaymentTrackingWidget />);
    
    // Check first payment details
    const firstPayment = screen.getByText('Metro Station Electrical').closest('div');
    expect(firstPayment).toHaveTextContent('INV-2024-001');
    expect(firstPayment).toHaveTextContent('$45,000');
    expect(firstPayment).toHaveTextContent('Awaiting final inspection approval');
    
    // Check second payment details
    const secondPayment = screen.getByText('Hospital Wing Construction').closest('div');
    expect(secondPayment).toHaveTextContent('INV-2024-002');
    expect(secondPayment).toHaveTextContent('$75,000');
    expect(secondPayment).toHaveTextContent('Bank Transfer');
  });

  it('handles empty payment list gracefully', () => {
    // Mock the component with empty payments array
    jest.spyOn(Array.prototype, 'filter').mockReturnValueOnce([]);
    
    render(<PaymentTrackingWidget />);
    
    expect(screen.getByText('No orders found for the selected status.')).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<PaymentTrackingWidget />);
    
    const amounts = screen.getAllByText(/\$[\d,]+/);
    amounts.forEach(amount => {
      expect(amount.textContent).toMatch(/\$[\d,]+(?:k)?/);
    });
  });

  it('shows view invoice button for all payments', () => {
    render(<PaymentTrackingWidget />);
    
    const viewInvoiceButtons = screen.getAllByText('View Invoice');
    expect(viewInvoiceButtons).toHaveLength(3); // One for each payment
  });

  it('shows send reminder button only for pending payments', () => {
    render(<PaymentTrackingWidget />);
    
    const sendReminderButtons = screen.getAllByText('Send Reminder');
    expect(sendReminderButtons).toHaveLength(1); // Only for pending payment
  });

  it('maintains filter state when switching between statuses', () => {
    render(<PaymentTrackingWidget />);
    
    // Click Pending
    fireEvent.click(screen.getByText('Pending'));
    expect(screen.getByText('Metro Station Electrical')).toBeInTheDocument();
    expect(screen.queryByText('Hospital Wing Construction')).not.toBeInTheDocument();
    
    // Click Paid
    fireEvent.click(screen.getByText('Paid'));
    expect(screen.queryByText('Metro Station Electrical')).not.toBeInTheDocument();
    expect(screen.getByText('Hospital Wing Construction')).toBeInTheDocument();
    
    // Click All
    fireEvent.click(screen.getByText('All'));
    expect(screen.getByText('Metro Station Electrical')).toBeInTheDocument();
    expect(screen.getByText('Hospital Wing Construction')).toBeInTheDocument();
  });
}); 