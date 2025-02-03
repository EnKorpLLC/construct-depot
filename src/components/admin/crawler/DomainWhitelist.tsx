'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Domain {
  id: string;
  domain: string;
  isAllowed: boolean;
  notes?: string;
}

export default function DomainWhitelist() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const addDomain = async () => {
    try {
      const response = await fetch('/api/admin/crawler/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain, notes: newNotes }),
      });

      if (!response.ok) throw new Error('Failed to add domain');

      const data = await response.json();
      setDomains([...domains, data]);
      setNewDomain('');
      setNewNotes('');
      toast.success('Domain added successfully');
    } catch (error) {
      toast.error('Failed to add domain');
    }
  };

  const toggleDomain = async (id: string, isAllowed: boolean) => {
    try {
      const response = await fetch(`/api/admin/crawler/domains/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAllowed }),
      });

      if (!response.ok) throw new Error('Failed to update domain');

      setDomains(domains.map(d => 
        d.id === id ? { ...d, isAllowed } : d
      ));
      toast.success('Domain updated successfully');
    } catch (error) {
      toast.error('Failed to update domain');
    }
  };

  const deleteDomain = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/crawler/domains/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete domain');

      setDomains(domains.filter(d => d.id !== id));
      toast.success('Domain deleted successfully');
    } catch (error) {
      toast.error('Failed to delete domain');
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Domain Whitelist</h2>
        
        {/* Add new domain */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Enter domain (e.g., supplier.com)"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Notes (optional)"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            className="flex-1"
          />
          <Button onClick={addDomain}>
            <Plus className="w-4 h-4 mr-2" />
            Add Domain
          </Button>
        </div>

        {/* Domain list */}
        <div className="space-y-4">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{domain.domain}</p>
                {domain.notes && (
                  <p className="text-sm text-gray-500">{domain.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant={domain.isAllowed ? 'default' : 'outline'}
                  onClick={() => toggleDomain(domain.id, !domain.isAllowed)}
                >
                  {domain.isAllowed ? 'Allowed' : 'Blocked'}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteDomain(domain.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 