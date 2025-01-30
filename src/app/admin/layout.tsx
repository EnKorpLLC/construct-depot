import { Cog } from 'lucide-react';

const navigation = [
  {
    name: 'Services',
    href: '/admin/settings/services',
    icon: Cog,
    current: false,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
} 