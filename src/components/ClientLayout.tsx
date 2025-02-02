'use client';

import { SessionProvider } from "@/components/SessionProvider";
import { NavBar } from '@/components/NavBar';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <NavBar />
      <main>{children}</main>
    </SessionProvider>
  );
} 