import { Role } from '@prisma/client';
import { 
  BarChart3, Package, ShoppingCart, Truck, Users, 
  FileText, Settings, Briefcase, ClipboardList, 
  DollarSign, Wrench, Shield 
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  roles: Role[];
}

export const menuItems: Record<string, MenuItem[]> = {
  admin: [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: BarChart3, 
      path: '/admin/dashboard',
      roles: [Role.admin, Role.super_admin] 
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: Users, 
      path: '/admin/users',
      roles: [Role.admin, Role.super_admin] 
    },
    { 
      id: 'products', 
      label: 'Products', 
      icon: Package, 
      path: '/admin/products',
      roles: [Role.admin, Role.super_admin] 
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: FileText, 
      path: '/admin/reports',
      roles: [Role.admin, Role.super_admin] 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      path: '/admin/settings',
      roles: [Role.super_admin] 
    }
  ],
  supplier: [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: BarChart3, 
      path: '/supplier/dashboard',
      roles: [Role.supplier, Role.super_admin] 
    },
    { 
      id: 'products', 
      label: 'Products', 
      icon: Package, 
      path: '/supplier/products',
      roles: [Role.supplier, Role.super_admin] 
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: ShoppingCart, 
      path: '/supplier/orders',
      roles: [Role.supplier, Role.super_admin] 
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: Truck, 
      path: '/supplier/inventory',
      roles: [Role.supplier, Role.super_admin] 
    }
  ],
  contractor: [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: BarChart3, 
      path: '/contractor/dashboard',
      roles: [Role.general_contractor, Role.super_admin] 
    },
    { 
      id: 'projects', 
      label: 'Projects', 
      icon: Briefcase, 
      path: '/contractor/projects',
      roles: [Role.general_contractor, Role.super_admin] 
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: ClipboardList, 
      path: '/contractor/orders',
      roles: [Role.general_contractor, Role.super_admin] 
    },
    { 
      id: 'subcontractors', 
      label: 'Subcontractors', 
      icon: Users, 
      path: '/contractor/subcontractors',
      roles: [Role.general_contractor, Role.super_admin] 
    }
  ],
  subcontractor: [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: BarChart3, 
      path: '/subcontractor/dashboard',
      roles: [Role.subcontractor, Role.super_admin] 
    },
    { 
      id: 'jobs', 
      label: 'Active Jobs', 
      icon: Briefcase, 
      path: '/subcontractor/jobs',
      roles: [Role.subcontractor, Role.super_admin] 
    },
    { 
      id: 'bids', 
      label: 'Bids', 
      icon: DollarSign, 
      path: '/subcontractor/bids',
      roles: [Role.subcontractor, Role.super_admin] 
    },
    { 
      id: 'materials', 
      label: 'Materials', 
      icon: Wrench, 
      path: '/subcontractor/materials',
      roles: [Role.subcontractor, Role.super_admin] 
    }
  ]
};

export const navbarItems: MenuItem[] = [
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    path: '/products',
    roles: [Role.supplier, Role.general_contractor, Role.subcontractor, Role.admin, Role.super_admin]
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Shield,
    path: '/admin/dashboard',
    roles: [Role.admin, Role.super_admin]
  }
]; 