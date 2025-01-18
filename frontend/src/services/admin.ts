import { AdminActivity, AdminActivityQueryParams, AdminActivityResponse, AdminUser, createActivitySchema, createUserSchema, updateUserSchema, UserStatus } from '@/types/admin'

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
      const queryParams = new URLSearchParams()
      
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.offset) queryParams.append('offset', params.offset.toString())
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.adminId) queryParams.append('adminId', params.adminId)
      if (params.action) queryParams.append('action', params.action)
      if (params.target) queryParams.append('target', params.target)

      const response = await fetch(`${this.baseUrl}/api/admin/activities?${queryParams}`)
      
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

  // User Management Methods
  async createUser(userData: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<AdminUser> {
    try {
      // Validate user data
      const validatedData = createUserSchema.parse(userData);

      const response = await fetch(`${this.baseUrl}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create user: ${response.statusText}`);
      }

      const data = await response.json();
      await this.logUserAction('CREATE_USER', data.id, { email: userData.email });
      return data as AdminUser;
    } catch (error) {
      console.error('[AdminService] createUser error:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    try {
      // Validate update data
      const validatedData = updateUserSchema.parse(updates);

      const response = await fetch(`${this.baseUrl}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.statusText}`);
      }

      const data = await response.json();
      await this.logUserAction('UPDATE_USER', userId, updates);
      return data as AdminUser;
    } catch (error) {
      console.error('[AdminService] updateUser error:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.statusText}`);
      }

      await this.logUserAction('DELETE_USER', userId);
    } catch (error) {
      console.error('[AdminService] deleteUser error:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<AdminUser> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/users/${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      const data = await response.json();
      return data as AdminUser;
    } catch (error) {
      console.error('[AdminService] getUser error:', error);
      throw error;
    }
  }

  async listUsers(params?: {
    limit?: number;
    offset?: number;
    status?: UserStatus;
    role?: string;
  }): Promise<{ users: AdminUser[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.role) queryParams.append('role', params.role);

      const response = await fetch(`${this.baseUrl}/api/admin/users?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data = await response.json();
      return data as { users: AdminUser[]; total: number };
    } catch (error) {
      console.error('[AdminService] listUsers error:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<AdminUser> {
    return this.updateUser(userId, { status });
  }
} 