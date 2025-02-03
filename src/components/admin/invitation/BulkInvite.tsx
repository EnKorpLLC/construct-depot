'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Role, BatchStatus } from '@prisma/client';
import { Upload, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationData {
  email: string;
  role: Role;
  company?: string;
}

interface Batch {
  id: string;
  name: string;
  status: BatchStatus;
  invitations: {
    email: string;
    status: string;
  }[];
  createdAt: string;
}

export default function BulkInvite() {
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('SUPPLIER');
  const [newCompany, setNewCompany] = useState('');
  const [batchName, setBatchName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);

  const addInvitation = () => {
    if (!newEmail) return;
    setInvitations([
      ...invitations,
      { email: newEmail, role: newRole, company: newCompany || undefined },
    ]);
    setNewEmail('');
    setNewCompany('');
  };

  const removeInvitation = (index: number) => {
    setInvitations(invitations.filter((_, i) => i !== index));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const rows = csv.split('\n').filter(Boolean);
        const newInvitations = rows.slice(1).map(row => {
          const [email, role, company] = row.split(',').map(cell => cell.trim());
          return {
            email,
            role: (role?.toUpperCase() as Role) || 'SUPPLIER',
            company: company || undefined,
          };
        });
        setInvitations([...invitations, ...newInvitations]);
        toast.success(`Added ${newInvitations.length} invitations from CSV`);
      } catch (error) {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const sendInvitations = async () => {
    if (!batchName || invitations.length === 0) {
      toast.error('Please provide a batch name and at least one invitation');
      return;
    }

    try {
      const response = await fetch('/api/admin/invitations/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: batchName,
          invitations,
          templateId: selectedTemplate || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to send invitations');

      const data = await response.json();
      setBatches([data, ...batches]);
      setInvitations([]);
      setBatchName('');
      toast.success('Invitations sent successfully');
    } catch (error) {
      toast.error('Failed to send invitations');
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Bulk Invitations</h2>

        {/* Batch Configuration */}
        <div className="space-y-4 mb-6">
          <Input
            placeholder="Batch Name"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
          />
          <Select
            value={selectedTemplate}
            onValueChange={setSelectedTemplate}
            className="w-full"
          >
            <option value="">Default Template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
        </div>

        {/* CSV Upload */}
        <div className="mb-6">
          <label className="block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-500">
            <Upload className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">Upload CSV file</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">
            CSV format: email,role,company (optional)
          </p>
        </div>

        {/* Manual Entry */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1"
          />
          <Select
            value={newRole}
            onValueChange={(value) => setNewRole(value as Role)}
            className="w-48"
          >
            {Object.values(Role).map((role) => (
              <option key={role} value={role}>
                {role.toLowerCase().replace('_', ' ')}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Company (optional)"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            className="flex-1"
          />
          <Button onClick={addInvitation}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Invitation List */}
        <div className="space-y-2 mb-6">
          {invitations.map((invitation, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div>
                <p className="font-medium">{invitation.email}</p>
                <p className="text-sm text-gray-500">
                  {invitation.role.toLowerCase().replace('_', ' ')}
                  {invitation.company && ` • ${invitation.company}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeInvitation(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Send Button */}
        <div className="flex justify-end">
          <Button
            onClick={sendInvitations}
            disabled={invitations.length === 0 || !batchName}
          >
            Send {invitations.length} Invitation{invitations.length !== 1 && 's'}
          </Button>
        </div>

        {/* Recent Batches */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Recent Batches</h3>
          <div className="space-y-4">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{batch.name}</h4>
                  <span className={`text-sm px-2 py-1 rounded ${
                    batch.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    batch.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                    batch.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {batch.status.toLowerCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(batch.createdAt).toLocaleDateString()}
                  {' • '}
                  {batch.invitations.length} invitation{batch.invitations.length !== 1 && 's'}
                </p>
                {batch.status === 'FAILED' && (
                  <div className="mt-2 p-2 bg-red-50 rounded flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span>Some invitations failed to send. Check the logs for details.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
} 