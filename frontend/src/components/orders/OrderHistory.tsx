'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { theme } from '@/lib/theme';
import { formatDate } from '@/lib/utils';

interface OrderHistoryEntry {
  id: string;
  fromStatus: string;
  toStatus: string;
  note: string | null;
  createdAt: string;
  user: {
    name: string;
  };
  metadata?: Record<string, any>;
}

interface OrderHistoryProps {
  orderId: string;
}

export function OrderHistory({ orderId }: OrderHistoryProps) {
  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderHistory();
  }, [orderId]);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}/history`);
      if (!response.ok) throw new Error('Failed to fetch order history');
      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return theme.statusColors[status as keyof typeof theme.statusColors] || theme.colors.greyDarker;
  };

  if (loading) return <div>Loading history...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!history.length) return <div>No history available</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
        <CardDescription>
          Track all changes and updates to this order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="border-l-4 pl-4 py-2"
            style={{ borderColor: getStatusColor(entry.toStatus) }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Badge
                  style={{
                    backgroundColor: getStatusColor(entry.fromStatus),
                    color: '#ffffff',
                  }}
                >
                  {entry.fromStatus}
                </Badge>
                <span className="text-gray-500">→</span>
                <Badge
                  style={{
                    backgroundColor: getStatusColor(entry.toStatus),
                    color: '#ffffff',
                  }}
                >
                  {entry.toStatus}
                </Badge>
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(new Date(entry.createdAt))}
              </div>
            </div>
            <p className="text-sm text-gray-700">{entry.note}</p>
            <p className="text-sm text-gray-500">Updated by {entry.user.name}</p>
            {entry.metadata && (
              <div className="mt-2 text-sm text-gray-600">
                {entry.metadata.reason && (
                  <p>Reason: {entry.metadata.reason}</p>
                )}
                {entry.metadata.comment && (
                  <p>Comment: {entry.metadata.comment}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 