import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import ProfileSettings from '@/components/profile/ProfileSettings';

// Mock next-auth
jest.mock('next-auth/react');

// Mock fetch
global.fetch = jest.fn();

describe('ProfileSettings', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    companyName: 'Test Corp',
    taxExempt: false,
    taxExemptionNumber: null,
    role: 'CUSTOMER'
  };

  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated'
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: mockUser })
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the profile settings form with user data', async () => {
    render(<ProfileSettings />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue('John');
      expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe');
      expect(screen.getByLabelText(/company name/i)).toHaveValue('Test Corp');
      expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com');
    });
  });

  it('handles form submission successfully', async () => {
    render(<ProfileSettings />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const companyNameInput = screen.getByLabelText(/company name/i);

    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } });
    fireEvent.change(companyNameInput, { target: { value: 'New Corp' } });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          companyName: 'New Corp'
        })
      });
    });

    expect(await screen.findByText(/profile updated successfully/i)).toBeInTheDocument();
  });

  it('displays validation errors', async () => {
    render(<ProfileSettings />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);

    fireEvent.change(firstNameInput, { target: { value: '' } });
    fireEvent.change(lastNameInput, { target: { value: '' } });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/last name is required/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<ProfileSettings />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/failed to update profile/i)).toBeInTheDocument();
  });

  it('toggles tax exemption form', async () => {
    render(<ProfileSettings />);

    const taxExemptToggle = screen.getByRole('checkbox', { name: /tax exempt/i });
    
    fireEvent.click(taxExemptToggle);
    
    expect(await screen.findByLabelText(/tax exemption number/i)).toBeInTheDocument();
    
    fireEvent.click(taxExemptToggle);
    
    await waitFor(() => {
      expect(screen.queryByLabelText(/tax exemption number/i)).not.toBeInTheDocument();
    });
  });

  it('handles password change', async () => {
    render(<ProfileSettings />);

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    fireEvent.click(changePasswordButton);

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });

    const submitPasswordButton = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(submitPasswordButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/users/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: 'oldpass123',
          newPassword: 'newpass123'
        })
      });
    });

    expect(await screen.findByText(/password updated successfully/i)).toBeInTheDocument();
  });
}); 