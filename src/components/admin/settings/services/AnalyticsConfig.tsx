'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { toast } from 'sonner';

export function AnalyticsConfig() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [config, setConfig] = useState({
    measurementId: '',
    enabled: true,
    anonymizeIp: true,
    enableDebugMode: false
  });

  const handleVerifyTracking = async () => {
    try {
      setIsVerifying(true);
      // Verification logic will be implemented here
      toast.success('GA4 tracking code verified');
    } catch (error) {
      toast.error('Failed to verify GA4 tracking code');
      console.error('Error verifying GA4:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="measurementId">
            Measurement ID
            <span className="ml-1 text-sm text-muted-foreground">
              (Format: G-XXXXXXXXXX)
            </span>
          </Label>
          <Input
            id="measurementId"
            placeholder="G-XXXXXXXXXX"
            value={config.measurementId}
            onChange={(e) => setConfig({ ...config, measurementId: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Enable Analytics</Label>
            <div className="text-sm text-muted-foreground">
              Collect anonymous usage data
            </div>
          </div>
          <Switch
            id="enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="anonymizeIp">Anonymize IP Addresses</Label>
            <div className="text-sm text-muted-foreground">
              Enhance user privacy
            </div>
          </div>
          <Switch
            id="anonymizeIp"
            checked={config.anonymizeIp}
            onCheckedChange={(checked) => setConfig({ ...config, anonymizeIp: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enableDebugMode">Debug Mode</Label>
            <div className="text-sm text-muted-foreground">
              Enable console logging
            </div>
          </div>
          <Switch
            id="enableDebugMode"
            checked={config.enableDebugMode}
            onCheckedChange={(checked) => setConfig({ ...config, enableDebugMode: checked })}
          />
        </div>
      </div>

      <Button 
        variant="outline" 
        onClick={handleVerifyTracking}
        disabled={isVerifying || !config.measurementId}
      >
        {isVerifying ? 'Verifying...' : 'Verify Tracking Code'}
      </Button>
    </div>
  );
} 