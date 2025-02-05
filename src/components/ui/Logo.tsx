import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const sizes = {
    sm: { width: 120, height: 40 },
    md: { width: 180, height: 60 },
    lg: { width: 240, height: 80 },
  };

  const handleLogoClick = () => {
    if (!session) {
      router.push('/');
      return;
    }

    switch (session.user.role) {
      case Role.super_admin:
        router.push('/admin/settings/services');
        break;
      case Role.admin:
        router.push('/admin/dashboard');
        break;
      case Role.supplier:
        router.push('/supplier/dashboard');
        break;
      case Role.general_contractor:
        router.push('/contractor/dashboard');
        break;
      case Role.subcontractor:
        router.push('/subcontractor/dashboard');
        break;
      default:
        router.push('/');
    }
  };

  return (
    <Link href="#" onClick={handleLogoClick} className={className}>
      <Image
        src="/logos/CDLogoUpdated-removebg-preview.png"
        alt="Construct Depot Logo"
        width={sizes[size].width}
        height={sizes[size].height}
        priority
        className="object-contain"
      />
    </Link>
  );
} 