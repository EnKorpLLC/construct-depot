import axios from 'axios';

interface Project {
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

interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  status: 'on_track' | 'warning' | 'over_budget';
}

interface TimelineEvent {
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

interface Message {
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const CustomerDashboardService = {
  // Project Overview
  getProjects: async (): Promise<Project[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customer/projects`);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  // Budget Tracking
  getBudgetCategories: async (projectId: string): Promise<BudgetCategory[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customer/projects/${projectId}/budget/categories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching budget categories:', error);
      throw error;
    }
  },

  getBudgetSummary: async (projectId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customer/projects/${projectId}/budget/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching budget summary:', error);
      throw error;
    }
  },

  // Timeline
  getTimelineEvents: async (projectId: string): Promise<TimelineEvent[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customer/projects/${projectId}/timeline`);
      return response.data;
    } catch (error) {
      console.error('Error fetching timeline events:', error);
      throw error;
    }
  },

  updateTimelineEvent: async (projectId: string, eventId: string, updates: Partial<TimelineEvent>) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/customer/projects/${projectId}/timeline/${eventId}`,
        updates
      );
      return response.data;
    } catch (error) {
      console.error('Error updating timeline event:', error);
      throw error;
    }
  },

  // Communication
  getMessages: async (): Promise<Message[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customer/messages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  sendMessage: async (message: Omit<Message, 'id' | 'timestamp' | 'status'>) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/customer/messages`, message);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  getNotifications: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customer/notifications`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId: string) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/customer/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  getContacts: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customer/contacts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  },
};

export default CustomerDashboardService; 