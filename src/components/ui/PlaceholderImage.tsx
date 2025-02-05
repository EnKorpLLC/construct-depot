import Image from 'next/image';
import { LucideIcon, Package, Grid } from 'lucide-react';

interface PlaceholderImageProps {
  type: 'product' | 'category';
  className?: string;
  width?: number;
  height?: number;
}

const placeholderIcons: Record<'product' | 'category', LucideIcon> = {
  product: Package,
  category: Grid,
};

export function PlaceholderImage({ type, className = '', width = 300, height = 300 }: PlaceholderImageProps) {
  const Icon = placeholderIcons[type];

  return (
    <div 
      className={`bg-gradient-to-br from-primary-light/10 to-secondary-light/10 flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <Icon className="w-1/3 h-1/3 text-grey-lighter" />
    </div>
  );
} 