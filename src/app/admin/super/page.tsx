'use client';

import { TabsRoot as Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import DomainWhitelist from '@/components/admin/crawler/DomainWhitelist';
import ScheduleManager from '@/components/admin/crawler/ScheduleManager';
import PriceHistory from '@/components/admin/crawler/PriceHistory';
import TemplateManager from '@/components/admin/invitation/TemplateManager';
import BulkInvite from '@/components/admin/invitation/BulkInvite';
import CompanyVerification from '@/components/admin/invitation/CompanyVerification';

export default function SuperAdminDashboard() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Super Admin Dashboard</h1>

      <Tabs defaultValue="crawler" className="space-y-4">
        <TabsList>
          <TabsTrigger value="crawler">Web Crawler</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="crawler" className="space-y-6">
          <DomainWhitelist />
          <ScheduleManager />
          <PriceHistory />
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          <TemplateManager />
          <BulkInvite />
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <CompanyVerification />
        </TabsContent>
      </Tabs>
    </div>
  );
} 