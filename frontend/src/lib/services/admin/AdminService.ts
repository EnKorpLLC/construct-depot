import { AdminActivity, AdminActivityQueryParams, AdminActivityResponse, createActivitySchema } from '@/types/admin'

export class AdminService {
  private static instance: AdminService
  private baseUrl: string

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
  }

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService()
    }
    return AdminService.instance
  }

  // Get admin activities with filtering and pagination
  async getActivities(params: AdminActivityQueryParams): Promise<AdminActivityResponse> {
    try {
      console.log('[AdminService] getActivities input params:', params);
      
      const queryParams = []
      
      // Always include limit and offset
      const limit = params.limit || 10;
      const offset = params.offset || 0;
      console.log('[AdminService] Using limit:', limit, 'offset:', offset);
      
      queryParams.push(`limit=${limit}`);
      queryParams.push(`offset=${offset}`);
      
      // Add optional filters
      if (params.startDate) queryParams.push(`startDate=${params.startDate}`)
      if (params.endDate) queryParams.push(`endDate=${params.endDate}`)
      if (params.adminId) queryParams.push(`adminId=${params.adminId}`)
      if (params.action) queryParams.push(`action=${params.action}`)
      if (params.target) queryParams.push(`target=${params.target}`)

      const url = `${this.baseUrl}/api/admin/activities?${queryParams.join('&')}`;
      console.log('[AdminService] Constructed URL:', url);
      console.log('[AdminService] Query params array:', queryParams);

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`)
      }

      const data = await response.json()
      return data as AdminActivityResponse
    } catch (error) {
      console.error('[AdminService] getActivities error:', error)
      throw error
    }
  }

  // Create a new admin activity
  async createActivity(activity: {
    action: AdminActivity['action']
    target: string
    details?: Record<string, any>
  }): Promise<AdminActivity> {
    try {
      // Validate activity data
      const validatedData = createActivitySchema.parse(activity)

      const response = await fetch(`${this.baseUrl}/api/admin/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validatedData)
      })

      if (!response.ok) {
        throw new Error(`Failed to create activity: ${response.statusText}`)
      }

      const data = await response.json()
      return data as AdminActivity
    } catch (error) {
      console.error('[AdminService] createActivity error:', error)
      throw error
    }
  }

  // Log system configuration changes
  async logConfigChange(target: string, details: Record<string, any>): Promise<void> {
    try {
      await this.createActivity({
        action: 'SYSTEM_CONFIG',
        target,
        details
      })
    } catch (error) {
      console.error('[AdminService] logConfigChange error:', error)
      // Don't throw error for logging failures
    }
  }

  // Log crawler actions
  async logCrawlerAction(
    action: 'START_CRAWLER' | 'STOP_CRAWLER' | 'UPDATE_CRAWLER',
    target: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await this.createActivity({
        action,
        target,
        details
      })
    } catch (error) {
      console.error('[AdminService] logCrawlerAction error:', error)
      // Don't throw error for logging failures
    }
  }

  // Log order management actions
  async logOrderAction(
    action: 'APPROVE_ORDER' | 'REJECT_ORDER' | 'UPDATE_ORDER',
    orderId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await this.createActivity({
        action,
        target: `order/${orderId}`,
        details
      })
    } catch (error) {
      console.error('[AdminService] logOrderAction error:', error)
      // Don't throw error for logging failures
    }
  }

  // Log user management actions
  async logUserAction(
    action: 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER',
    userId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await this.createActivity({
        action,
        target: `user/${userId}`,
        details
      })
    } catch (error) {
      console.error('[AdminService] logUserAction error:', error)
      // Don't throw error for logging failures
    }
  }

  // Log product management actions
  async logProductAction(
    action: 'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'DELETE_PRODUCT',
    productId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await this.createActivity({
        action,
        target: `product/${productId}`,
        details
      })
    } catch (error) {
      console.error('[AdminService] logProductAction error:', error)
      // Don't throw error for logging failures
    }
  }
} 