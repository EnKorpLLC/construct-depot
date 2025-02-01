import 'next-auth';
import { JWT } from 'next-auth/jwt';

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
    user: User & {
      id: string;
      role: UserRole;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
} 