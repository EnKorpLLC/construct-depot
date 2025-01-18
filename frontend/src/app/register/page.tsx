'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type UserRole = 'CUSTOMER' | 'GENERAL_CONTRACTOR' | 'SUBCONTRACTOR' | 'SUPPLIER';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('CUSTOMER');

  // Clear error on page load
  useEffect(() => {
    setError('');
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const userData = {
      email: formData.get('email'),
      password: formData.get('password'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      companyName: formData.get('companyName') || undefined,
      role: selectedRole,
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          // Format validation errors
          const errorMessages = data.details.map((error: any) => {
            const field = error.path[0];
            return `${field}: ${error.message}`;
          });
          throw new Error(errorMessages.join('\n'));
        }
        throw new Error(data.error || 'Registration failed');
      }

      // Redirect based on role
      if (userData.role === 'SUPPLIER') {
        router.push('/supplier/apply');
      } else {
        router.push('/login?registered=true');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary-dark"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4 text-sm">
              {error.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">• {line}</p>
              ))}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First name"
                id="firstName"
                name="firstName"
                type="text"
                required
                fullWidth
              />

              <Input
                label="Last name"
                id="lastName"
                name="lastName"
                type="text"
                required
                fullWidth
              />
            </div>

            <Input
              label="Company name"
              id="companyName"
              name="companyName"
              type="text"
              fullWidth
            />

            <Input
              label="Email address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              fullWidth
            />

            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              fullWidth
            />

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                I am a...
              </label>
              <div className="space-y-2">
                {[
                  { value: 'CUSTOMER', label: 'Customer' },
                  { value: 'GENERAL_CONTRACTOR', label: 'General Contractor' },
                  { value: 'SUBCONTRACTOR', label: 'Subcontractor' },
                  { 
                    value: 'SUPPLIER', 
                    label: 'Supplier',
                    description: 'Join our network of suppliers and reach more customers. Application required.'
                  },
                ].map((role) => (
                  <div
                    key={role.value}
                    className={`
                      relative rounded-lg px-5 py-4 cursor-pointer
                      border-2 transition-colors
                      ${
                        selectedRole === role.value
                          ? 'border-primary bg-primary bg-opacity-5'
                          : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                    onClick={() => setSelectedRole(role.value as UserRole)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {role.label}
                          </p>
                          {role.description && (
                            <p className="text-gray-500 text-sm mt-1">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedRole === role.value && (
                        <svg
                          className="h-5 w-5 text-primary"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              Create account
            </Button>

            <p className="text-xs text-center text-gray-500">
              By creating an account, you agree to our{' '}
              <Link
                href="/terms"
                className="text-primary hover:text-primary-dark"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="text-primary hover:text-primary-dark"
              >
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
} 