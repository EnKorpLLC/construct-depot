import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface ServiceConfigProps {
  serviceName: string;
  description: string;
  status: 'active' | 'inactive';
}

export function ServiceConfig({ serviceName, description, status }: ServiceConfigProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{serviceName}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{description}</p>
        <div className="mt-4">
          <span className={`px-2 py-1 rounded text-sm ${
            status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {status}
          </span>
        </div>
      </CardContent>
    </Card>
  );
} 