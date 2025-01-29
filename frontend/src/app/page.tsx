'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      // Redirect based on user role
      switch (session.user?.role) {
        case 'SUPER_ADMIN':
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'SUPPLIER':
          router.push('/supplier/dashboard');
          break;
        case 'GENERAL_CONTRACTOR':
          router.push('/contractor/dashboard');
          break;
        case 'SUBCONTRACTOR':
          router.push('/subcontractor/dashboard');
          break;
        default:
          router.push('/dashboard');
          break;
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
}
