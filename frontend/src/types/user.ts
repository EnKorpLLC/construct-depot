export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPermissions {
  canManageUsers: boolean;
  canManageRoles: boolean;
  canAccessCrawler: boolean;
  canConfigureSystem: boolean;
  canManageOrders: boolean;
  canManageInventory: boolean;
  canAccessAnalytics: boolean;
  canAccessSupport: boolean;
  canManageProducts: boolean;
}

// Role-based permissions mapping
export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  [UserRole.SUPER_ADMIN]: {
    canManageUsers: true,
    canManageRoles: true,
    canAccessCrawler: true,
    canConfigureSystem: true,
    canManageOrders: true,
    canManageInventory: true,
    canAccessAnalytics: true,
    canAccessSupport: true,
    canManageProducts: true
  },
  [UserRole.ADMIN]: {
    canManageUsers: true,
    canManageRoles: false,
    canAccessCrawler: false,
    canConfigureSystem: false,
    canManageOrders: true,
    canManageInventory: true,
    canAccessAnalytics: true,
    canAccessSupport: true,
    canManageProducts: true
  },
  [UserRole.SUPPLIER]: {
    canManageUsers: false,
    canManageRoles: false,
    canAccessCrawler: false,
    canConfigureSystem: false,
    canManageOrders: false,
    canManageInventory: true,
    canAccessAnalytics: true,
    canAccessSupport: true,
    canManageProducts: true
  },
  [UserRole.CUSTOMER]: {
    canManageUsers: false,
    canManageRoles: false,
    canAccessCrawler: false,
    canConfigureSystem: false,
    canManageOrders: false,
    canManageInventory: false,
    canAccessAnalytics: false,
    canAccessSupport: true,
    canManageProducts: false
  }
};

// Helper functions for permission checking
export function hasPermission(user: User, permission: keyof UserPermissions): boolean {
  return DEFAULT_PERMISSIONS[user.role][permission];
}

export function isSuperAdmin(user: User): boolean {
  return user.role === UserRole.SUPER_ADMIN;
}

export function isAdmin(user: User): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
}

export function isSupplier(user: User): boolean {
  return user.role === UserRole.SUPPLIER;
}

export function isCustomer(user: User): boolean {
  return user.role === UserRole.CUSTOMER;
} 