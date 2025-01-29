import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommunicationHubWidget from '../CommunicationHubWidget';
import CustomerDashboardService from '@/services/customer/dashboardService';
import webSocketService from '@/services/websocket/WebSocketService';

// Mock the services
jest.mock('@/services/customer/dashboardService');
jest.mock('@/services/websocket/WebSocketService');

describe('CommunicationHubWidget', () => {
  const mockMessages = [
    {
      id: '1',
      sender: {
        name: 'John Doe',
        role: 'Project Manager',
        avatar: '/avatars/john.jpg',
      },
      content: 'Test message 1',
      timestamp: new Date('2024-01-25T10:30:00'),
      status: 'read' as const,
    },
  ];

  const mockNotifications = [
    {
      id: '1',
      type: 'alert' as const,
      title: 'Test Notification',
      description: 'Test notification description',
      timestamp: new Date('2024-01-25T09:00:00'),
      priority: 'high' as const,
      isRead: false,
    },
  ];

  const mockContacts = [
    {
      id: '1',
      name: 'John Doe',
      role: 'Project Manager',
      email: 'john@example.com',
      phone: '123-456-7890',
      availability: 'available' as const,
    },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock the service methods
    (CustomerDashboardService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (CustomerDashboardService.getNotifications as jest.Mock).mockResolvedValue(mockNotifications);
    (CustomerDashboardService.getContacts as jest.Mock).mockResolvedValue(mockContacts);
  });

  it('renders loading state initially', () => {
    render(<CommunicationHubWidget />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders messages tab by default', async () => {
    render(<CommunicationHubWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Test message 1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Project Manager')).toBeInTheDocument();
  });

  it('switches between tabs', async () => {
    render(<CommunicationHubWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Test message 1')).toBeInTheDocument();
    });

    // Switch to notifications tab
    const notificationsTab = screen.getByText('Notifications');
    await userEvent.click(notificationsTab);
    
    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('Test notification description')).toBeInTheDocument();

    // Switch to contacts tab
    const contactsTab = screen.getByText('Contacts');
    await userEvent.click(contactsTab);
    
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
  });

  it('handles new message via WebSocket', async () => {
    render(<CommunicationHubWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Test message 1')).toBeInTheDocument();
    });

    const newMessage = {
      id: '2',
      sender: {
        name: 'Jane Smith',
        role: 'Designer',
      },
      content: 'New test message',
      timestamp: new Date(),
      status: 'delivered' as const,
    };

    // Simulate WebSocket message
    act(() => {
      const wsCallback = (webSocketService.subscribe as jest.Mock).mock.calls[0][1];
      wsCallback(newMessage);
    });

    expect(screen.getByText('New test message')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('handles new notification via WebSocket', async () => {
    render(<CommunicationHubWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Test message 1')).toBeInTheDocument();
    });

    const newNotification = {
      id: '2',
      type: 'update' as const,
      title: 'New Notification',
      description: 'New notification description',
      timestamp: new Date(),
      priority: 'medium' as const,
      isRead: false,
    };

    // Simulate WebSocket message
    act(() => {
      const wsCallback = (webSocketService.subscribe as jest.Mock).mock.calls[1][1];
      wsCallback(newNotification);
    });

    const notificationsTab = screen.getByText('Notifications');
    await userEvent.click(notificationsTab);

    expect(screen.getByText('New Notification')).toBeInTheDocument();
    expect(screen.getByText('New notification description')).toBeInTheDocument();
  });

  it('handles contact status change via WebSocket', async () => {
    render(<CommunicationHubWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Test message 1')).toBeInTheDocument();
    });

    const statusUpdate = {
      id: '1',
      availability: 'busy' as const,
    };

    // Simulate WebSocket message
    act(() => {
      const wsCallback = (webSocketService.subscribe as jest.Mock).mock.calls[2][1];
      wsCallback(statusUpdate);
    });

    const contactsTab = screen.getByText('Contacts');
    await userEvent.click(contactsTab);

    expect(screen.getByTestId('availability-status-1')).toHaveClass('bg-yellow-500');
  });

  it('handles error state', async () => {
    (CustomerDashboardService.getMessages as jest.Mock).mockRejectedValue(new Error('Failed to load'));
    
    render(<CommunicationHubWidget />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load communication data/i)).toBeInTheDocument();
    });
  });

  it('marks notification as read', async () => {
    render(<CommunicationHubWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Test message 1')).toBeInTheDocument();
    });

    const notificationsTab = screen.getByText('Notifications');
    await userEvent.click(notificationsTab);

    const markAsReadButton = screen.getByText('Mark as Read');
    await userEvent.click(markAsReadButton);

    expect(CustomerDashboardService.markNotificationAsRead).toHaveBeenCalledWith('1');
  });
}); 