'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Role } from '@prisma/client';
import { Plus, Star, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  role: Role;
  onboardingSteps: string[];
  isDefault: boolean;
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newStep, setNewStep] = useState('');

  const resetForm = () => {
    setEditingTemplate(null);
    setNewStep('');
  };

  const addTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const response = await fetch('/api/admin/invitations/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate),
      });

      if (!response.ok) throw new Error('Failed to add template');

      const data = await response.json();
      setTemplates([...templates, data]);
      resetForm();
      toast.success('Template added successfully');
    } catch (error) {
      toast.error('Failed to add template');
    }
  };

  const updateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const response = await fetch(`/api/admin/invitations/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate),
      });

      if (!response.ok) throw new Error('Failed to update template');

      setTemplates(templates.map(t => 
        t.id === editingTemplate.id ? editingTemplate : t
      ));
      resetForm();
      toast.success('Template updated successfully');
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/invitations/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');

      setTemplates(templates.filter(t => t.id !== id));
      toast.success('Template deleted successfully');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const setDefaultTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/invitations/templates/${id}/default`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to set default template');

      setTemplates(templates.map(t => ({
        ...t,
        isDefault: t.id === id,
      })));
      toast.success('Default template updated');
    } catch (error) {
      toast.error('Failed to set default template');
    }
  };

  const addOnboardingStep = () => {
    if (!editingTemplate || !newStep) return;
    setEditingTemplate({
      ...editingTemplate,
      onboardingSteps: [...editingTemplate.onboardingSteps, newStep],
    });
    setNewStep('');
  };

  const removeOnboardingStep = (index: number) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      onboardingSteps: editingTemplate.onboardingSteps.filter((_, i) => i !== index),
    });
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Invitation Templates</h2>

        {/* Template Form */}
        <div className="space-y-4 mb-8 border-b pb-8">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Template Name"
              value={editingTemplate?.name || ''}
              onChange={(e) => setEditingTemplate(prev => prev ? {
                ...prev,
                name: e.target.value,
              } : null)}
            />
            <Select
              value={editingTemplate?.role || 'SUPPLIER'}
              onValueChange={(value) => setEditingTemplate(prev => prev ? {
                ...prev,
                role: value as Role,
              } : null)}
            >
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role.toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </Select>
          </div>
          
          <Input
            placeholder="Email Subject"
            value={editingTemplate?.subject || ''}
            onChange={(e) => setEditingTemplate(prev => prev ? {
              ...prev,
              subject: e.target.value,
            } : null)}
          />
          
          <Textarea
            placeholder="Email Body (supports HTML)"
            value={editingTemplate?.body || ''}
            onChange={(e) => setEditingTemplate(prev => prev ? {
              ...prev,
              body: e.target.value,
            } : null)}
            rows={6}
          />

          {/* Onboarding Steps */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Onboarding Steps</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add step"
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
              />
              <Button onClick={addOnboardingStep}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {editingTemplate?.onboardingSteps.map((step, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span>{step}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOnboardingStep(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={editingTemplate?.id ? updateTemplate : addTemplate}>
              {editingTemplate?.id ? 'Update' : 'Add'} Template
            </Button>
          </div>
        </div>

        {/* Template List */}
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{template.name}</h3>
                  {template.isDefault && (
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Role: {template.role.toLowerCase().replace('_', ' ')}
                </p>
                <p className="text-sm text-gray-500">
                  Steps: {template.onboardingSteps.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDefaultTemplate(template.id)}
                  disabled={template.isDefault}
                >
                  Set Default
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditingTemplate(template)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteTemplate(template.id)}
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