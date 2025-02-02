import NextAuth from 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role;
  }
} 