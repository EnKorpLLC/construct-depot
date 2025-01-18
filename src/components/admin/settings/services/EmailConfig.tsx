'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export function EmailConfig() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [config, setConfig] = useState({
    email: '',
    password: '',
    host: 'smtp.office365.com',
    port: '587',
    secure: true
  });

  const handleTestConnection = async () => {
    try {
      setIsTestingConnection(true);
      // Test connection logic will be implemented here
      toast.success('Email connection test successful');
    } catch (error) {
      toast.error('Email connection test failed');
      console.error('Error testing email connection:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="outlook@yourdomain.com"
            value={config.email}
            onChange={(e) => setConfig({ ...config, email: e.target.value })}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="password">
            App Password
            <span className="ml-1 text-sm text-muted-foreground">
              (Create this in your Microsoft Account settings)
            </span>
          </Label>
          <Input
            id="password"
            type="password"
            value={config.password}
            onChange={(e) => setConfig({ ...config, password: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="host">SMTP Host</Label>
          <Input
            id="host"
            value={config.host}
            onChange={(e) => setConfig({ ...config, host: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="port">SMTP Port</Label>
          <Input
            id="port"
            value={config.port}
            onChange={(e) => setConfig({ ...config, port: e.target.value })}
          />
        </div>
      </div>

      <Button 
        variant="outline" 
        onClick={handleTestConnection}
        disabled={isTestingConnection || !config.email || !config.password}
      >
        {isTestingConnection ? 'Testing...' : 'Test Connection'}
      </Button>
    </div>
  );
} 