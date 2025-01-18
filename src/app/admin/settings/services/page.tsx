'use client';

import { ServiceConfig } from '@/components/admin/settings/ServiceConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export default function ServicesPage() {
  return (
    <div className="container mx-auto py-10">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Service Settings</CardTitle>
          <CardDescription>
            Configure and manage third-party service integrations. All sensitive data is encrypted before storage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceConfig />
        </CardContent>
      </Card>
    </div>
  );
} 