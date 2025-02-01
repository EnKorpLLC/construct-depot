import 'next-auth';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  GENERAL_CONTRACTOR = 'GENERAL_CONTRACTOR',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  USER = 'user'
}

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    }
  }
} 