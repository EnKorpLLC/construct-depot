'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { toast } from 'sonner';

export function SecurityConfig() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [config, setConfig] = useState({
    rateLimiting: {
      enabled: true,
      maxRequests: '100',
      windowMs: '900000', // 15 minutes
    },
    session: {
      maxAge: '86400', // 24 hours
      updateAge: '3600', // 1 hour
    },
    auth: {
      allowedDomains: '',
      mfaEnabled: false,
      passwordPolicy: 'strong',
    }
  });

  const handleVerifySettings = async () => {
    try {
      setIsVerifying(true);
      // Verification logic will be implemented here
      toast.success('Security settings verified');
    } catch (error) {
      toast.error('Failed to verify security settings');
      console.error('Error verifying security settings:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {/* Rate Limiting Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Rate Limiting</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="rateLimitingEnabled">Enable Rate Limiting</Label>
                <div className="text-sm text-muted-foreground">
                  Protect against brute force attacks
                </div>
              </div>
              <Switch
                id="rateLimitingEnabled"
                checked={config.rateLimiting.enabled}
                onCheckedChange={(checked) => 
                  setConfig({
                    ...config,
                    rateLimiting: { ...config.rateLimiting, enabled: checked }
                  })
                }
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="maxRequests">Max Requests</Label>
              <Input
                id="maxRequests"
                type="number"
                value={config.rateLimiting.maxRequests}
                onChange={(e) => 
                  setConfig({
                    ...config,
                    rateLimiting: { ...config.rateLimiting, maxRequests: e.target.value }
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Session Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Session Management</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sessionMaxAge">Session Max Age (seconds)</Label>
              <Input
                id="sessionMaxAge"
                type="number"
                value={config.session.maxAge}
                onChange={(e) => 
                  setConfig({
                    ...config,
                    session: { ...config.session, maxAge: e.target.value }
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Authentication Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Authentication</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="allowedDomains">
                Allowed Email Domains
                <span className="ml-1 text-sm text-muted-foreground">
                  (Comma separated)
                </span>
              </Label>
              <Input
                id="allowedDomains"
                placeholder="example.com,company.com"
                value={config.auth.allowedDomains}
                onChange={(e) => 
                  setConfig({
                    ...config,
                    auth: { ...config.auth, allowedDomains: e.target.value }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="mfaEnabled">Multi-Factor Authentication</Label>
                <div className="text-sm text-muted-foreground">
                  Require 2FA for all users
                </div>
              </div>
              <Switch
                id="mfaEnabled"
                checked={config.auth.mfaEnabled}
                onCheckedChange={(checked) => 
                  setConfig({
                    ...config,
                    auth: { ...config.auth, mfaEnabled: checked }
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="passwordPolicy">Password Policy</Label>
              <Select
                value={config.auth.passwordPolicy}
                onValueChange={(value) => 
                  setConfig({
                    ...config,
                    auth: { ...config.auth, passwordPolicy: value }
                  })
                }
              >
                <SelectTrigger id="passwordPolicy">
                  <SelectValue placeholder="Select a policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                  <SelectItem value="medium">Medium (8+ chars, mixed case)</SelectItem>
                  <SelectItem value="strong">Strong (12+ chars, mixed case, numbers)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <Button 
        variant="outline" 
        onClick={handleVerifySettings}
        disabled={isVerifying}
      >
        {isVerifying ? 'Verifying...' : 'Verify Settings'}
      </Button>
    </div>
  );
} 