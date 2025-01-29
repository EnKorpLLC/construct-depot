import * as React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, className = '', indicatorClassName = '' }, ref) => {
    const percentage = (value / max) * 100;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-100 ${className}`}
      >
        <div
          className={`h-full w-full flex-1 bg-blue-600 transition-all ${indicatorClassName}`}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
export default Progress; 