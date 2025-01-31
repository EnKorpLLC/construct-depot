'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { TabsRoot, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { EmailConfig } from './services/EmailConfig';
import { AnalyticsConfig } from './services/AnalyticsConfig';
import { SecurityConfig } from './services/SecurityConfig';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export function ServiceConfig() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Save configuration logic will be implemented here
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Service Configuration</CardTitle>
        <CardDescription>
          Configure third-party services and integrations. All credentials are encrypted before storage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TabsRoot defaultValue="email" className="space-y-4">
          <TabsList>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <EmailConfig />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsConfig />
          </TabsContent>

          <TabsContent value="security">
            <SecurityConfig />
          </TabsContent>
        </TabsRoot>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 