import { OrderStatusColors } from '@/types/prisma';

export const theme = {
  colors: {
    primary: '#0010ff',
    secondary: '#ff7300',
    accent: '#e65003',
    background: '#ffffff',
    text: '#000000',
    greyLighter: '#f5f5f5',
    greyLight: '#e0e0e0',
    grey: '#999999',
    greyDark: '#666666',
    greyDarker: '#333333',
    error: '#ff0000',
    success: '#00ff00',
    warning: '#ffff00',
    info: '#0000ff'
  },
  statusColors: OrderStatusColors,
  fonts: {
    primary: 'Inter, sans-serif',
    secondary: 'Arial, sans-serif'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  }
} as const;

export type Theme = typeof theme; 