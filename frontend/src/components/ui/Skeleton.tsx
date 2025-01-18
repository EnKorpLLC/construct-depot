interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="space-y-2">
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="h-10 w-full sm:w-auto bg-gray-200 rounded animate-pulse" />
    </div>
  );
} 