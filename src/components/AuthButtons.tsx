'use client';

import { useRouter } from 'next/navigation';

interface AuthButtonsProps {
  variant?: 'primary' | 'secondary';
}

export function AuthButtons({ variant = 'primary' }: AuthButtonsProps) {
  const router = useRouter();

  return (
    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
      <button
        onClick={() => router.push('/auth/signup')}
        className={`${
          variant === 'primary'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
        } px-8 py-3 rounded-lg font-semibold transition-colors`}
      >
        {variant === 'primary' ? 'Get Started' : 'Sign Up Now'}
      </button>
    </div>
  );
} 