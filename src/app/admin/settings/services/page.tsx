'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { Settings, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  requiresConfiguration: boolean;
}

export default function ServicesSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<ServiceSetting[]>([
    {
      id: 'pooling',
      name: 'Order Pooling',
      description: 'Enable group buying functionality for bulk orders',
      enabled: true,
      requiresConfiguration: false,
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Track and analyze order patterns and user behavior',
      enabled: true,
      requiresConfiguration: false,
    },
    {
      id: 'notifications',
      name: 'Email Notifications',
      description: 'Send automated emails for order updates and pool status',
      enabled: true,
      requiresConfiguration: true,
    },
    {
      id: 'inventory',
      name: 'Inventory Management',
      description: 'Track product stock levels and send low stock alerts',
      enabled: true,
      requiresConfiguration: false,
    }
  ]);

  const handleToggle = async (settingId: string) => {
    if (session?.user?.role !== Role.super_admin) {
      toast.error('Only super admins can modify service settings');
      return;
    }

    try {
      // In a real app, this would be an API call
      setSettings(settings.map(setting => 
        setting.id === settingId 
          ? { ...setting, enabled: !setting.enabled }
          : setting
      ));
      toast.success('Service setting updated successfully');
    } catch (error) {
      toast.error('Failed to update service setting');
    }
  };

  if (!session?.user?.role || session.user.role !== Role.super_admin) {
    return (
      <div className="min-h-screen bg-grey-lighter/10 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-grey-darker mb-2">Access Denied</h2>
          <p className="text-grey-lighter">Only super administrators can access service settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-lighter/10 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-blue-darker" />
          <h1 className="text-2xl font-bold text-grey-darker">Service Settings</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-6">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-start justify-between p-4 border border-grey-lighter rounded-lg hover:bg-grey-lighter/5 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-grey-darker">{setting.name}</h3>
                  <p className="text-grey-lighter mt-1">{setting.description}</p>
                  {setting.requiresConfiguration && (
                    <div className="mt-2 flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">Requires additional configuration</span>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={setting.enabled}
                      onChange={() => handleToggle(setting.id)}
                    />
                    <div className="w-11 h-6 bg-grey-lighter rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-grey-lighter after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-darker"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 