'use client';

import { SessionProvider } from "next-auth/react";
import Navbar from "./Navbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider 
      // Refetch session every hour
      refetchInterval={3600}
      // Don't re-fetch session when window is focused
      refetchOnWindowFocus={false}
    >
      <Navbar />
      {children}
    </SessionProvider>
  );
} 