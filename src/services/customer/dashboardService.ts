import { DashboardData } from '@/types/dashboard';

export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  totalSpent: number;
  recentOrders: Array<{
    id: string;
    createdAt: Date;
    status: string;
    totalAmount: number;
  }>;
}

export interface Project {
  id: string;
  name: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  progress: number;
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  contractor: {
    name: string;
    rating: number;
    contact: string;
  };
  team: Array<{
    name: string;
    role: string;
  }>;
  documents: Array<{
    name: string;
    type: string;
    lastUpdated: Date;
  }>;
  nextMilestone: {
    name: string;
    dueDate: Date;
  };
}

export interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  status: 'on_track' | 'warning' | 'over_budget';
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  projectedOverage: number;
  recentExpenses: number;
  pendingApprovals: number;
  spendingTrend: Array<{
    date: string;
    amount: number;
  }>;
}

export interface Expense {
  id: string;
  date: Date;
  status: string;
  amount: number;
  category: string;
  description: string;
}

export interface Message {
  id: string;
  sender: {
    name: string;
    role: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
  attachments?: Array<{
    name: string;
    type: 'document' | 'image';
    size: string;
  }>;
  status: 'sent' | 'delivered' | 'read';
}

export interface Notification {
  id: string;
  type: 'update' | 'alert' | 'reminder';
  title: string;
  description: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  availability: 'available' | 'busy' | 'offline';
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  type: 'milestone' | 'task' | 'meeting' | 'inspection' | 'delivery';
  status: 'completed' | 'in_progress' | 'upcoming' | 'delayed';
  description?: string;
  assignees?: Array<{
    name: string;
    role: string;
  }>;
  notes?: string;
}

export interface TimelineSummary {
  totalMilestones: number;
  completedMilestones: number;
  upcomingEvents: number;
  delayedItems: number;
  projectProgress: number;
  estimatedCompletion: Date;
}

export const dashboardService = {
  async getProjects(): Promise<Project[]> {
    // TODO: Implement actual API call to fetch projects
    const response = await fetch('/api/projects');
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    return response.json();
  },

  async getBudgetCategories(projectId: string): Promise<BudgetCategory[]> {
    // TODO: Implement actual API call to fetch budget categories
    return [
      {
        name: 'Materials',
        allocated: 10000,
        spent: 5000,
        remaining: 5000,
        status: 'on_track'
      }
    ];
  },

  async getBudgetSummary(projectId: string): Promise<BudgetSummary> {
    // TODO: Implement actual API call to fetch budget summary
    return {
      totalBudget: 50000,
      totalSpent: 25000,
      totalRemaining: 25000,
      projectedOverage: 0,
      recentExpenses: 0,
      pendingApprovals: 0,
      spendingTrend: []
    };
  },

  async addExpense(projectId: string, expense: Omit<Expense, 'id' | 'date' | 'status'>): Promise<void> {
    // TODO: Implement actual API call to add expense
    const response = await fetch(`/api/projects/${projectId}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(expense)
    });

    if (!response.ok) {
      throw new Error('Failed to add expense');
    }
  },

  async getUserStats(userId: string): Promise<DashboardStats> {
    // TODO: Implement actual API call to fetch user stats
    return {
      totalOrders: 0,
      activeOrders: 0,
      totalSpent: 0,
      recentOrders: []
    };
  },

  async getRecommendations(userId: string) {
    // TODO: Implement actual API call to fetch recommendations
    return [];
  },

  async getDashboardData(): Promise<DashboardData> {
    // TODO: Implement actual API call to fetch dashboard data
    return {
      stats: {
        totalOrders: 0,
        activeOrders: 0,
        totalSpent: 0,
        recentOrders: []
      },
      projects: [],
      recommendations: [],
      statistics: {
        ordersThisMonth: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        customerSatisfaction: 0
      },
      notifications: []
    };
  },

  async getMessages(): Promise<Message[]> {
    // TODO: Implement actual API call to fetch messages
    const response = await fetch('/api/messages');
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    return response.json();
  },

  async getNotifications(): Promise<Notification[]> {
    // TODO: Implement actual API call to fetch notifications
    const response = await fetch('/api/notifications');
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return response.json();
  },

  async getContacts(): Promise<Contact[]> {
    // TODO: Implement actual API call to fetch contacts
    const response = await fetch('/api/contacts');
    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }
    return response.json();
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    // TODO: Implement actual API call to mark notification as read
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  },

  async sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'status'>): Promise<Message> {
    // TODO: Implement actual API call to send message
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    return response.json();
  },

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    // TODO: Implement actual API call to update project
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      throw new Error('Failed to update project');
    }
  },

  async getRecentActivity() {
    // TODO: Implement actual API call to fetch recent activity
    return [];
  },

  async getTimelineEvents(projectId: string): Promise<TimelineEvent[]> {
    // TODO: Implement actual API call to fetch timeline events
    const response = await fetch(`/api/projects/${projectId}/timeline`);
    if (!response.ok) {
      throw new Error('Failed to fetch timeline events');
    }
    return response.json();
  },

  async updateTimelineEvent(projectId: string, eventId: string, updates: Partial<TimelineEvent>): Promise<void> {
    // TODO: Implement actual API call to update timeline event
    const response = await fetch(`/api/projects/${projectId}/timeline/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      throw new Error('Failed to update timeline event');
    }
  }
};

export default dashboardService; 