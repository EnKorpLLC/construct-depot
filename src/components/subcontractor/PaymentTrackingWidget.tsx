'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  Calendar,
  Filter,
} from 'lucide-react';

interface Payment {
  id: string;
  projectName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
  paymentMethod?: string;
  paymentDate?: Date;
  notes?: string;
}

interface PaymentSummary {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  averagePaymentTime: number;
  upcomingPayments: number;
  recentPayments: number;
}

export default function PaymentTrackingWidget() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Mock data - will be replaced with API calls
  const payments: Payment[] = [
    {
      id: '1',
      projectName: 'Metro Station Electrical',
      invoiceNumber: 'INV-2024-001',
      amount: 45000,
      dueDate: new Date('2024-02-15'),
      status: 'pending',
      notes: 'Awaiting final inspection approval',
    },
    {
      id: '2',
      projectName: 'Hospital Wing Construction',
      invoiceNumber: 'INV-2024-002',
      amount: 75000,
      dueDate: new Date('2024-01-30'),
      status: 'paid',
      paymentMethod: 'Bank Transfer',
      paymentDate: new Date('2024-01-28'),
    },
    {
      id: '3',
      projectName: 'Office Complex Renovation',
      invoiceNumber: 'INV-2024-003',
      amount: 28000,
      dueDate: new Date('2024-01-20'),
      status: 'overdue',
      notes: 'Following up with client',
    },
  ];

  const summary: PaymentSummary = {
    totalReceived: 250000,
    totalPending: 120000,
    totalOverdue: 45000,
    averagePaymentTime: 15,
    upcomingPayments: 3,
    recentPayments: 5,
  };

  const statusFilters = ['All', 'Pending', 'Paid', 'Overdue'];

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Payment Tracking</h2>
          <Button variant="outline" size="sm">
            Create Invoice
          </Button>
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Received</span>
            </div>
            <div className="text-2xl font-bold text-green-700 mb-1">
              ${(summary.totalReceived / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-green-600">Total Received</div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-xs text-yellow-600 font-medium">Pending</span>
            </div>
            <div className="text-2xl font-bold text-yellow-700 mb-1">
              ${(summary.totalPending / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-yellow-600">Awaiting Payment</div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-xs text-red-600 font-medium">Overdue</span>
            </div>
            <div className="text-2xl font-bold text-red-700 mb-1">
              ${(summary.totalOverdue / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-red-600">Past Due</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
            <Clock className="h-5 w-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Avg. Payment Time</div>
              <div className="text-lg font-semibold">{summary.averagePaymentTime} days</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Upcoming</div>
              <div className="text-lg font-semibold">{summary.upcomingPayments} payments</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
            <ArrowUpRight className="h-5 w-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Recent</div>
              <div className="text-lg font-semibold">{summary.recentPayments} received</div>
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-gray-400" />
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status === 'All' ? null : status.toLowerCase())}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap
                ${selectedStatus === status.toLowerCase() || (status === 'All' && !selectedStatus)
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Payments List */}
        <div className="space-y-4">
          {payments
            .filter(
              (payment) =>
                !selectedStatus || payment.status === selectedStatus
            )
            .map((payment) => (
              <div
                key={payment.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{payment.projectName}</h3>
                    <p className="text-sm text-gray-500">
                      Invoice: {payment.invoiceNumber}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm font-medium
                    ${payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'}`}
                  >
                    {payment.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <div className="text-sm">
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-medium ml-1">
                        ${payment.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div className="text-sm">
                      <span className="text-gray-500">Due Date:</span>
                      <span className="font-medium ml-1">
                        {payment.dueDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {payment.notes && (
                  <div className="text-sm text-gray-500 mb-4">
                    Note: {payment.notes}
                  </div>
                )}

                {payment.status === 'paid' && (
                  <div className="text-sm text-gray-500 mb-4">
                    Paid via {payment.paymentMethod} on{' '}
                    {payment.paymentDate?.toLocaleDateString()}
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    View Invoice
                  </Button>
                  {payment.status === 'pending' && (
                    <Button size="sm">
                      Send Reminder
                    </Button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
} 