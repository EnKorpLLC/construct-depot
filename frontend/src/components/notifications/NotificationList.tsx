'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Notification } from '@/lib/services/NotificationService';

interface NotificationListProps {
  limit?: number;
}

export function NotificationList({ limit = 10 }: NotificationListProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session, offset]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/notifications?limit=${limit}&offset=${offset}`
      );
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      
      if (offset === 0) {
        setNotifications(data);
      } else {
        setNotifications(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      if (!response.ok) throw new Error('Failed to mark notification as read');

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const loadMore = () => {
    setOffset(prev => prev + limit);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_STATUS_CHANGE':
        return '📦';
      case 'POOL_PROGRESS':
        return '📊';
      case 'POOL_COMPLETE':
        return '✅';
      default:
        return '📢';
    }
  };

  if (loading && !notifications.length) {
    return <div>Loading notifications...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!notifications.length) {
    return <div>No notifications</div>;
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`transition-colors ${
            notification.read ? 'bg-gray-50' : 'bg-white'
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </span>
                <CardTitle className="text-lg">{notification.title}</CardTitle>
              </div>
              {!notification.read && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => markAsRead(notification.id)}
                >
                  Mark as read
                </Badge>
              )}
            </div>
            <CardDescription>
              {new Date(notification.createdAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{notification.message}</p>
            {notification.type === 'POOL_PROGRESS' && notification.metadata && (
              <div className="mt-2">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${notification.metadata.progress}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {notification.metadata.currentQuantity} /{' '}
                  {notification.metadata.targetQuantity} units
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {hasMore && (
        <Button
          onClick={loadMore}
          variant="outline"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  );
} 