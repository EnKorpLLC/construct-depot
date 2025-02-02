'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Role } from '@prisma/client';
import { Settings, LogOut, LogIn } from 'lucide-react';

export function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Construct Depot
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {session?.user ? (
              <>
                {/* Settings link - visible to all logged-in users */}
                <Link
                  href="/admin/settings/services"
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
                {/* Logout button */}
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <LogIn className="h-5 w-5" />
                <span>Log In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 