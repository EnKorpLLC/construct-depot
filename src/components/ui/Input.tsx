import React from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = false,
  className,
  ...props
}) => {
  return (
    <div className={twMerge('flex flex-col gap-1', fullWidth && 'w-full')}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={twMerge(
          'px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
          'rounded-md',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          fullWidth && 'w-full',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input; 