'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import Button from './ui/Button';

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary">
          Bulk Buyer Group
        </Link>

        <div className="flex items-center space-x-4">
          {session ? (
            <>
              {session.user.role === 'SUPPLIER' && (
                <>
                  <Link href="/supplier/products" className="text-gray-600 hover:text-primary">
                    Products
                  </Link>
                  <Link href="/supplier/orders" className="text-gray-600 hover:text-primary">
                    Orders
                  </Link>
                  <Link href="/supplier/profile" className="text-gray-600 hover:text-primary">
                    Profile
                  </Link>
                </>
              )}
              {session.user.role === 'CUSTOMER' && (
                <>
                  <Link href="/products" className="text-gray-600 hover:text-primary">
                    Products
                  </Link>
                  <Link href="/orders" className="text-gray-600 hover:text-primary">
                    Orders
                  </Link>
                  <Link href="/cart" className="text-gray-600 hover:text-primary">
                    Cart
                  </Link>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 