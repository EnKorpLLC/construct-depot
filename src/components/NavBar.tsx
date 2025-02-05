'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogOut, LogIn } from 'lucide-react';
import { Logo } from './ui/Logo';
import { navbarItems } from '@/lib/navigation';

export function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-grey-lighter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Logo size="sm" />
            
            {session?.user && navbarItems.map((item) => {
              if (!item.roles.includes(session.user.role)) return null;
              
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className="text-grey-darker hover:text-blue-darker flex items-center gap-1 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <button
                onClick={() => signOut()}
                className="text-grey-darker hover:text-blue-darker flex items-center gap-1 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="text-grey-darker hover:text-blue-darker flex items-center gap-1 transition-colors"
              >
                <LogIn className="h-5 w-5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 