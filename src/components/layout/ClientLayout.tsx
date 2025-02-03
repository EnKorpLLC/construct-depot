'use client';

import { type FC, type ReactNode } from 'react';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="min-h-screen bg-grey-lighter/10">
      {children}
    </div>
  );
} 