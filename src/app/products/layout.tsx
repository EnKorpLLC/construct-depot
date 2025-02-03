'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-grey-lighter/10">
      {children}
    </div>
  );
} 