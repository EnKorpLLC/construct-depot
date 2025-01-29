import { signIn, signOut } from 'next-auth/react';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  verifyEmailSchema
} from '@/types/auth';

export class AuthService {
  private static instance: AuthService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Validate credentials
      const validatedData = loginSchema.parse(credentials);

      // Use NextAuth signIn
      const result = await signIn('credentials', {
        redirect: false,
        ...validatedData
      });

      if (!result?.ok) {
        throw new Error(result?.error || 'Login failed');
      }

      // Fetch user data
      const response = await fetch(`${this.baseUrl}/api/auth/session`);
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] login error:', error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Validate registration data
      const validatedData = registerSchema.parse(data);

      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      // Auto login after successful registration
      return this.login({
        email: validatedData.email,
        password: validatedData.password,
      });
    } catch (error) {
      console.error('[AuthService] register error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error('[AuthService] logout error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<void> {
    try {
      const validatedData = resetPasswordSchema.parse({
        token,
        password,
        confirmPassword,
      });

      const response = await fetch(`${this.baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        throw new Error('Password reset failed');
      }
    } catch (error) {
      console.error('[AuthService] resetPassword error:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const validatedData = forgotPasswordSchema.parse({ email });

      const response = await fetch(`${this.baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to send password reset email');
      }
    } catch (error) {
      console.error('[AuthService] forgotPassword error:', error);
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const validatedData = verifyEmailSchema.parse({ token });

      const response = await fetch(`${this.baseUrl}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        throw new Error('Email verification failed');
      }
    } catch (error) {
      console.error('[AuthService] verifyEmail error:', error);
      throw error;
    }
  }

  async refreshSession(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh session');
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] refreshSession error:', error);
      throw error;
    }
  }
} 