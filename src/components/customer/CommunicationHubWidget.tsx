'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  MessageSquare,
  Bell,
  FileText,
  Users,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react';
import CustomerDashboardService from '@/services/customer/dashboardService';
import useWebSocket from '@/hooks/useWebSocket';

interface Message {
  id: string;
  sender: {
    name: string;
    role: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
  attachments?: Array<{
    name: string;
    type: 'document' | 'image';
    size: string;
  }>;
  status: 'sent' | 'delivered' | 'read';
}

interface Notification {
  id: string;
  type: 'update' | 'alert' | 'reminder';
  title: string;
  description: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  availability: 'available' | 'busy' | 'offline';
}

export default function CommunicationHubWidget() {
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications' | 'contacts'>('messages');
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [messagesData, notificationsData, contactsData] = await Promise.all([
          CustomerDashboardService.getMessages(),
          CustomerDashboardService.getNotifications(),
          CustomerDashboardService.getContacts(),
        ]);
        setMessages(messagesData);
        setNotifications(notificationsData);
        setContacts(contactsData);
        setError(null);
      } catch (err) {
        setError('Failed to load communication data. Please try again later.');
        console.error('Error loading communication data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // WebSocket subscriptions for real-time updates
  useWebSocket<Message>('new_message', (message) => {
    setMessages(prev => [...prev, message]);
  });

  useWebSocket<Notification>('new_notification', (notification) => {
    setNotifications(prev => [...prev, notification]);
  });

  useWebSocket<{ id: string; availability: Contact['availability'] }>('contact_status_change', (update) => {
    setContacts(prev =>
      prev.map(contact =>
        contact.id === update.id
          ? { ...contact, availability: update.availability }
          : contact
      )
    );
  });

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await CustomerDashboardService.markNotificationAsRead(notificationId);
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleSendMessage = async (message: Omit<Message, 'id' | 'timestamp' | 'status'>) => {
    try {
      const newMessage = await CustomerDashboardService.sendMessage(message);
      setMessages(prevMessages => [...prevMessages, newMessage]);
      // No need to emit WebSocket event here as the server will broadcast it
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Communication Hub</h2>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Communication Hub</h2>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">{error}</div>
          </div>
        </div>
      </Card>
    );
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'update':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'reminder':
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAvailabilityColor = (availability: Contact['availability']) => {
    switch (availability) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Communication Hub</h2>
          <Button variant="outline" size="sm">
            New Message
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'messages'
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'notifications'
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'contacts'
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </button>
        </div>

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full" />
                    <div>
                      <div className="font-medium text-gray-900">{message.sender.name}</div>
                      <div className="text-sm text-gray-500">{message.sender.role}</div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{message.content}</p>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {message.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-gray-50 rounded p-2 text-sm"
                      >
                        {attachment.type === 'document' ? (
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-gray-400 mr-2" />
                        )}
                        <span className="text-gray-600">{attachment.name}</span>
                        <span className="text-gray-400 ml-2">({attachment.size})</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="sm">
                    Reply
                  </Button>
                  <Button variant="outline" size="sm">
                    View Thread
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 ${
                  !notification.isRead ? 'bg-blue-50 border-blue-100' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button variant="ghost" size="sm">
                        Mark as Read
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full relative">
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getAvailabilityColor(
                          contact.availability
                        )}`}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{contact.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{contact.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    Send Message
                  </Button>
                  <Button size="sm">
                    Schedule Call
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Link */}
        <div className="mt-6 text-center">
          <Button variant="ghost" className="text-blue-600 hover:text-blue-800">
            View All {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
} 