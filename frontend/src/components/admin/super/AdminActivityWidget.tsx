import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface AdminActivity {
  id: string
  adminId: string
  adminName: string
  action: string
  target: string
  timestamp: string
  details?: string
}

export function AdminActivityWidget() {
  const [activities, setActivities] = React.useState<AdminActivity[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/admin/activities')
        if (!response.ok) throw new Error('Failed to fetch admin activities')
        const data = await response.json()
        setActivities(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activities')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
    const interval = setInterval(fetchActivities, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Activity</CardTitle>
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
          <CardTitle>Admin Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-gray-500">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 border-b border-gray-100 pb-4 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.adminName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.action} - {activity.target}
                  </p>
                  {activity.details && (
                    <p className="mt-1 text-sm text-gray-500">{activity.details}</p>
                  )}
                </div>
                <time className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </time>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
} 