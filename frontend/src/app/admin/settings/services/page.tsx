import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceConfig } from '@/components/admin/settings/ServiceConfig';

export default function ServicesSettingsPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Service Configuration</h2>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <ServiceConfig
                serviceName="Core Services"
                description="Main application services configuration"
                status="active"
              />
            </TabsContent>
            <TabsContent value="integrations">
              {/* Integration settings */}
            </TabsContent>
            <TabsContent value="monitoring">
              {/* Monitoring settings */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 