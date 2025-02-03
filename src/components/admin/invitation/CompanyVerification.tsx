'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { VerificationStatus } from '@prisma/client';
import { CheckCircle, XCircle, AlertCircle, Clock, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface VerificationDoc {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

interface CompanyVerification {
  id: string;
  companyName: string;
  registrationNo?: string;
  website?: string;
  documents: VerificationDoc[];
  status: VerificationStatus;
  notes?: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export default function CompanyVerification() {
  const [verifications, setVerifications] = useState<CompanyVerification[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<VerificationStatus | 'ALL'>('ALL');
  const [notes, setNotes] = useState<string>('');
  const [selectedVerification, setSelectedVerification] = useState<string | null>(null);

  const updateStatus = async (id: string, status: VerificationStatus, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/verifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setVerifications(verifications.map(v =>
        v.id === id
          ? { ...v, status, notes: notes || v.notes, updatedAt: new Date().toISOString() }
          : v
      ));
      setSelectedVerification(null);
      setNotes('');
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'IN_REVIEW':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'MORE_INFO_NEEDED':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Company Verifications</h2>
          <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as VerificationStatus | 'ALL')}
          >
            <option value="ALL">All Status</option>
            {Object.values(VerificationStatus).map((status) => (
              <option key={status} value={status}>
                {status.toLowerCase().replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-4">
          {verifications
            .filter(v => selectedStatus === 'ALL' || v.status === selectedStatus)
            .map((verification) => (
              <div
                key={verification.id}
                className={`border rounded-lg p-4 ${
                  selectedVerification === verification.id ? 'border-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(verification.status)}
                      <h3 className="font-medium">{verification.companyName}</h3>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-grey-lighter">
                      <p>Submitted by: {verification.user.name} ({verification.user.email})</p>
                      {verification.registrationNo && (
                        <p>Registration: {verification.registrationNo}</p>
                      )}
                      {verification.website && (
                        <p className="flex items-center gap-1">
                          Website: 
                          <a
                            href={verification.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline flex items-center gap-1"
                          >
                            {verification.website}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </p>
                      )}
                      <p>Submitted: {new Date(verification.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedVerification(
                        selectedVerification === verification.id ? null : verification.id
                      )}
                    >
                      Review
                    </Button>
                  </div>
                </div>

                {/* Documents */}
                {verification.documents.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Documents</h4>
                    <div className="space-y-2">
                      {verification.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-grey-lighter/10 rounded hover:bg-grey-lighter/20"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{doc.name}</span>
                          <span className="text-xs text-grey-lighter">
                            ({new Date(doc.uploadedAt).toLocaleDateString()})
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Form */}
                {selectedVerification === verification.id && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <Textarea
                      placeholder="Add notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => updateStatus(verification.id, 'MORE_INFO_NEEDED', notes)}
                      >
                        Request Info
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => updateStatus(verification.id, 'REJECTED', notes)}
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => updateStatus(verification.id, 'APPROVED', notes)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
} 