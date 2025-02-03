'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session?.user || (session.user.role !== Role.admin && session.user.role !== Role.super_admin)) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-grey-lighter/10">
      {children}
    </div>
  );
} 