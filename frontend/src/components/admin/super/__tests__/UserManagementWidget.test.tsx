import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserManagementWidget from '../UserManagementWidget';
import { AdminUser } from '@/types/admin';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.confirm
const mockConfirm = jest.fn(() => true);
window.confirm = mockConfirm;

// Mock user data
const mockUsers: AdminUser[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'SUPPLIER',
    status: 'ACTIVE',
    createdAt: '2025-01-02T00:00:00Z'
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'CUSTOMER',
    status: 'INACTIVE',
    createdAt: '2025-01-03T00:00:00Z'
  }
];

const mockResponse = {
  users: mockUsers,
  total: 3
};

describe('UserManagementWidget', () => {
  const mockProps = {
    onCreateUser: jest.fn(),
    onEditUser: jest.fn(),
    onDeleteUser: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );
  });

  it('shows loading state initially', () => {
    render(<UserManagementWidget {...mockProps} />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('fetches and displays user data', async () => {
    render(<UserManagementWidget {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    // Check if all users are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('SUPPLIER')).toBeInTheDocument();
    expect(screen.getByText('INACTIVE')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          users: [mockUsers[0]],
          total: 1
        })
      })
    );

    render(<UserManagementWidget {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('search=John'));
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('handles role filtering', async () => {
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          users: [mockUsers[1]],
          total: 1
        })
      })
    );

    render(<UserManagementWidget {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const roleSelect = screen.getByRole('combobox');
    fireEvent.change(roleSelect, { target: { value: 'SUPPLIER' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('role=SUPPLIER'));
    });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('handles pagination', async () => {
    render(<UserManagementWidget {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    });
  });

  it('handles user deletion', async () => {
    render(<UserManagementWidget {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete user');
    fireEvent.click(deleteButtons[0]);

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this user?');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/users/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    expect(mockProps.onDeleteUser).toHaveBeenCalledWith('1');
  });

  it('handles edit user action', async () => {
    render(<UserManagementWidget {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Edit user');
    fireEvent.click(editButtons[0]);

    expect(mockProps.onEditUser).toHaveBeenCalledWith('1');
  });

  it('handles create user action', async () => {
    render(<UserManagementWidget {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add User'));

    expect(mockProps.onCreateUser).toHaveBeenCalled();
  });

  it('shows error state when fetch fails', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Failed to fetch'))
    );

    render(<UserManagementWidget {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
    });
  });

  it('displays correct role colors', async () => {
    render(<UserManagementWidget {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    const adminRole = screen.getByText('ADMIN');
    const supplierRole = screen.getByText('SUPPLIER');
    const customerRole = screen.getByText('CUSTOMER');

    expect(adminRole).toHaveClass('text-blue-600 bg-blue-100');
    expect(supplierRole).toHaveClass('text-green-600 bg-green-100');
    expect(customerRole).toHaveClass('text-orange-600 bg-orange-100');
  });

  it('displays empty state when no users found', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ users: [], total: 0 })
      })
    );

    render(<UserManagementWidget {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('No users found matching your criteria.')).toBeInTheDocument();
    });
  });
}); 