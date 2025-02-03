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
        aria-valuemax={100}
        aria-valuenow={value}
        className={`relative h-4 w-full overflow-hidden rounded-full bg-grey-lighter ${className}`}
      >
        <div
          className={`h-full w-full flex-1 bg-blue-darker transition-all ${indicatorClassName}`}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
export default Progress; 