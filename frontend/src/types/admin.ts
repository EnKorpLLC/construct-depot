import { z } from 'zod'

// User Management Types
export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminRole
  permissions: Permission[]
  createdAt: string
  updatedAt: string
  lastLogin?: string
  status: UserStatus
}

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SUPPORT = 'SUPPORT'
}

export enum Permission {
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_ORDERS = 'MANAGE_ORDERS',
  MANAGE_PRODUCTS = 'MANAGE_PRODUCTS',
  MANAGE_CRAWLERS = 'MANAGE_CRAWLERS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

// Activity Logging Types
export type AdminActivity = {
  id: string
  adminId: string
  action: 'SYSTEM_CONFIG' | 'START_CRAWLER' | 'STOP_CRAWLER' | 'UPDATE_CRAWLER' | 
         'APPROVE_ORDER' | 'REJECT_ORDER' | 'UPDATE_ORDER' |
         'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' |
         'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'DELETE_PRODUCT'
  target: string
  details?: Record<string, any>
  timestamp: Date
}

export type AdminActivityQueryParams = {
  limit?: number
  offset?: number
  startDate?: string
  endDate?: string
  adminId?: string
  action?: AdminActivity['action']
  target?: string
}

export type AdminActivityResponse = {
  activities: AdminActivity[]
  total: number
  limit: number
  offset: number
}

// Validation Schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.nativeEnum(AdminRole),
  permissions: z.array(z.nativeEnum(Permission)),
  password: z.string().min(8)
})

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.nativeEnum(AdminRole).optional(),
  permissions: z.array(z.nativeEnum(Permission)).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  password: z.string().min(8).optional()
})

export const createActivitySchema = z.object({
  action: z.enum([
    'SYSTEM_CONFIG',
    'START_CRAWLER',
    'STOP_CRAWLER',
    'UPDATE_CRAWLER',
    'APPROVE_ORDER',
    'REJECT_ORDER',
    'UPDATE_ORDER',
    'CREATE_USER',
    'UPDATE_USER',
    'DELETE_USER',
    'CREATE_PRODUCT',
    'UPDATE_PRODUCT',
    'DELETE_PRODUCT'
  ]),
  target: z.string(),
  details: z.record(z.any()).optional()
}) 