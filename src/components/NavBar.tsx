'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Role } from '@prisma/client';
import { Settings, LogOut, LogIn, Package, Shield } from 'lucide-react';

export function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-grey-lighter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-blue-darker hover:text-blue-lighter transition-colors">
              Construct Depot
            </Link>
            {session?.user && (
              <Link
                href="/products"
                className="text-grey-darker hover:text-blue-darker flex items-center gap-1 transition-colors"
              >
                <Package className="h-5 w-5" />
                <span>Products</span>
              </Link>
            )}
            {session?.user && (
              session.user.role === Role.super_admin && (
                <Link
                  href="/admin/super"
                  className="text-grey-darker hover:text-blue-darker flex items-center gap-1 transition-colors"
                >
                  <Shield className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
              )
            )}
          </div>
          <div className="flex items-center space-x-4">
            {session?.user ? (
              <>
                {/* Settings link - visible to all logged-in users */}
                <Link
                  href="/admin/settings/services"
                  className="text-grey-darker hover:text-blue-darker flex items-center gap-1 transition-colors"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
                {/* Logout button */}
                <button
                  onClick={() => signOut()}
                  className="text-grey-darker hover:text-orange-darker flex items-center gap-1 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="text-grey-darker hover:text-blue-darker flex items-center gap-1 transition-colors"
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