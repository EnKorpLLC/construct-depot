import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/customer/dashboard', icon: HomeIcon },
  { name: 'Orders', href: '/customer/orders', icon: ShoppingCartIcon },
  { name: 'Projects', href: '/customer/projects', icon: ClipboardDocumentListIcon },
  { name: 'Analytics', href: '/customer/analytics', icon: ChartBarIcon },
  { name: 'Team', href: '/customer/team', icon: UserGroupIcon },
  { name: 'Messages', href: '/customer/messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Settings', href: '/customer/settings', icon: CogIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200">
      <nav className="mt-6 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <item.icon className={`
                    h-5 w-5 mr-3
                    ${isActive ? 'text-blue-700' : 'text-gray-400'}
                  `} />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Pro Upgrade Banner */}
      <div className="absolute bottom-0 w-full p-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800">Upgrade to Pro</h3>
          <p className="mt-1 text-xs text-blue-700">
            Get access to advanced features and priority support.
          </p>
          <button className="mt-3 w-full px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  )
} 