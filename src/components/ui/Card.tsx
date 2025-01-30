import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`px-6 py-4 border-b border-gray-200 ${className}`}>
        {children}
      </div>
    );
  }
);
CardHeader.displayName = "CardHeader";

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className = '' }, ref) => {
    return (
      <h3 ref={ref} className={`text-lg font-semibold text-gray-900 ${className}`}>
        {children}
      </h3>
    );
  }
);
CardTitle.displayName = "CardTitle";

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className = '' }, ref) => {
    return (
      <p ref={ref} className={`text-sm text-gray-500 ${className}`}>
        {children}
      </p>
    );
  }
);
CardDescription.displayName = "CardDescription";

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`px-6 py-4 ${className}`}>
        {children}
      </div>
    );
  }
);
CardContent.displayName = "CardContent"; 