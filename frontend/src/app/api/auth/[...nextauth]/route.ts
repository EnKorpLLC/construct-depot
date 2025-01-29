import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { loginSchema } from '@/types/auth';
import logger from '@/lib/logger';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/register'
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          const validatedCredentials = loginSchema.parse(credentials);

          // Find user
          const user = await prisma.user.findUnique({
            where: { email: validatedCredentials.email },
            include: {
              permissions: true
            }
          });

          if (!user) {
            throw new Error('Invalid credentials');
          }

          // Verify password
          const isValidPassword = await compare(
            validatedCredentials.password,
            user.password
          );

          if (!isValidPassword) {
            throw new Error('Invalid credentials');
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions.map(p => p.name)
          };
        } catch (error) {
          console.error('[NextAuth] authorize error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.permissions = token.permissions;
      }
      return session;
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      logger.info('User signed in', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
        timestamp: new Date().toISOString(),
      });
    },
    async signOut({ token }) {
      logger.info('User signed out', {
        userId: token?.sub,
        timestamp: new Date().toISOString(),
      });
    },
    async createUser({ user }) {
      logger.info('New user created', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });
    },
    async linkAccount({ user, account, profile }) {
      logger.info('Account linked', {
        userId: user.id,
        provider: account.provider,
        timestamp: new Date().toISOString(),
      });
    },
    async session({ session, token }) {
      logger.debug('Session updated', {
        userId: token.sub,
        timestamp: new Date().toISOString(),
      });
    },
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 