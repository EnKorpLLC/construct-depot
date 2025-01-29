import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface GlobalConfig {
  maintenanceMode: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  maxConcurrentJobs: number
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  notificationsEnabled: boolean
}

export function GlobalConfigWidget() {
  const [config, setConfig] = React.useState<GlobalConfig | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/admin/system/config')
        if (!response.ok) throw new Error('Failed to fetch system configuration')
        const data = await response.json()
        setConfig(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch configuration')
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/system/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!response.ok) throw new Error('Failed to update system configuration')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Configuration</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!config) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Maintenance Mode</Label>
              <Select
                value={config.maintenanceMode ? 'enabled' : 'disabled'}
                onValueChange={(value) =>
                  setConfig({ ...config, maintenanceMode: value === 'enabled' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Log Level</Label>
              <Select
                value={config.logLevel}
                onValueChange={(value) =>
                  setConfig({ ...config, logLevel: value as GlobalConfig['logLevel'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Backup Frequency</Label>
              <Select
                value={config.backupFrequency}
                onValueChange={(value) =>
                  setConfig({ ...config, backupFrequency: value as GlobalConfig['backupFrequency'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notifications</Label>
              <Select
                value={config.notificationsEnabled ? 'enabled' : 'disabled'}
                onValueChange={(value) =>
                  setConfig({ ...config, notificationsEnabled: value === 'enabled' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 