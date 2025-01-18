import { Metadata } from 'next';
import { Suspense } from 'react';
import ProfileSettings from '@/components/profile/ProfileSettings';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { ProfileSkeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = {
  title: 'Profile Settings - Bulk Buyer Group',
  description: 'Manage your profile settings and preferences'
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 mb-4">
          <Breadcrumbs
            items={[
              { label: 'Settings', href: '/settings' },
              { label: 'Profile' }
            ]}
          />
        </div>
        
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow">
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfileSettings />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
} 