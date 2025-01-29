'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CustomerDashboardService } from '@/lib/services/customer/dashboardService';

interface Message {
  id: string;
  sender: {
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  timestamp: string;
  isUnread: boolean;
}

export function MessageCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const dashboardService = CustomerDashboardService.getInstance();
        const data = await dashboardService.getRecentMessages();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Messages</h3>
        <a
          href="/customer/messages"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          View all
        </a>
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex space-x-3 p-3 rounded-lg transition-colors ${
              message.isUnread ? 'bg-blue-50' : 'bg-white'
            }`}
          >
            <img
              src={message.sender.avatar}
              alt={message.sender.name}
              className="h-10 w-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {message.sender.name}
                  </p>
                  <p className="text-xs text-gray-500">{message.sender.role}</p>
                </div>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(message.timestamp), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {message.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          New Message
        </button>
      </div>
    </div>
  );
} 