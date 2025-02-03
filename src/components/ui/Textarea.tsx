'use client';

import * as React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        className={`
          flex min-h-[80px] w-full rounded-md border border-grey-lighter
          bg-white px-3 py-2 text-sm ring-offset-white
          placeholder:text-grey-darker focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-blue-darker focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50 ${className}
        `}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea }; 