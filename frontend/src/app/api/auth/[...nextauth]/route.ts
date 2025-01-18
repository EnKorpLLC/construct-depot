import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { loginSchema } from '@/types/auth';

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
    async signIn({ user }) {
      await prisma.authEvent.create({
        data: {
          type: 'SIGN_IN',
          userId: user.id,
          metadata: {
            userAgent: process.env.USER_AGENT,
            timestamp: new Date().toISOString()
          }
        }
      });
    },
    async signOut({ token }) {
      if (token?.sub) {
        await prisma.authEvent.create({
          data: {
            type: 'SIGN_OUT',
            userId: token.sub,
            metadata: {
              userAgent: process.env.USER_AGENT,
              timestamp: new Date().toISOString()
            }
          }
        });
      }
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 