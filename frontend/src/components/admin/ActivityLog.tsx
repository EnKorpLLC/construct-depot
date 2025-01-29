import { useEffect, useState } from 'react'
import { AdminActivity, AdminActivityQueryParams } from '@/types/admin'
import { AdminService } from '@/services/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

const ITEMS_PER_PAGE = 20

export default function ActivityLog() {
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<Omit<AdminActivityQueryParams, 'limit' | 'offset'>>({})

  const adminService = AdminService.getInstance()

  // Fetch activities with current filters and pagination
  const fetchActivities = async (reset = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const currentPage = reset ? 0 : page
      const response = await adminService.getActivities({
        ...filters,
        limit: ITEMS_PER_PAGE,
        offset: currentPage * ITEMS_PER_PAGE
      })

      setActivities(prev => reset ? response.activities : [...prev, ...response.activities])
      setHasMore(response.pagination.hasMore)
      setPage(currentPage)
    } catch (err) {
      setError('Failed to load activity log')
      console.error('Error fetching activities:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchActivities(true)
  }, [filters])

  // Handle filter changes
  const handleFilterChange = (key: keyof AdminActivityQueryParams, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  // Format activity for display
  const formatActivity = (activity: AdminActivity) => {
    const timestamp = format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm:ss')
    
    return (
      <div key={activity.id} className="py-2 border-b last:border-b-0">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-medium">{activity.adminName}</span>
            <span className="text-gray-600"> - {activity.action.replace(/_/g, ' ')}</span>
          </div>
          <span className="text-sm text-gray-500">{timestamp}</span>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          Target: {activity.target}
        </div>
        {activity.details && (
          <div className="text-sm text-gray-500 mt-1">
            {JSON.stringify(activity.details)}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <div className="flex gap-4 mt-4">
          <Select
            onValueChange={(value) => handleFilterChange('action', value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All actions</SelectItem>
              <SelectItem value="CREATE_USER">Create User</SelectItem>
              <SelectItem value="UPDATE_USER">Update User</SelectItem>
              <SelectItem value="DELETE_USER">Delete User</SelectItem>
              <SelectItem value="CREATE_PRODUCT">Create Product</SelectItem>
              <SelectItem value="UPDATE_PRODUCT">Update Product</SelectItem>
              <SelectItem value="DELETE_PRODUCT">Delete Product</SelectItem>
              <SelectItem value="UPDATE_SETTINGS">Update Settings</SelectItem>
              <SelectItem value="START_CRAWLER">Start Crawler</SelectItem>
              <SelectItem value="STOP_CRAWLER">Stop Crawler</SelectItem>
              <SelectItem value="UPDATE_CRAWLER">Update Crawler</SelectItem>
              <SelectItem value="APPROVE_ORDER">Approve Order</SelectItem>
              <SelectItem value="REJECT_ORDER">Reject Order</SelectItem>
              <SelectItem value="UPDATE_ORDER">Update Order</SelectItem>
              <SelectItem value="SYSTEM_CONFIG">System Config</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => handleFilterChange('target', value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All targets</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="product">Products</SelectItem>
              <SelectItem value="order">Orders</SelectItem>
              <SelectItem value="crawler">Crawler</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-500 mb-4">{error}</div>
        )}
        
        <div className="space-y-4">
          {activities.map(formatActivity)}
          
          {loading && (
            <div className="text-center py-4">Loading...</div>
          )}
          
          {!loading && hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setPage(prev => prev + 1)
                  fetchActivities()
                }}
              >
                Load More
              </Button>
            </div>
          )}
          
          {!loading && !hasMore && activities.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No activities found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 