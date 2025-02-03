import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`bg-white rounded-lg shadow-md border border-grey-lighter hover:border-grey-darker transition-colors ${className}`}>
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
      <div ref={ref} className={`px-6 py-4 border-b border-grey-lighter ${className}`}>
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
      <h3 ref={ref} className={`text-lg font-semibold text-grey-darker ${className}`}>
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
      <p ref={ref} className={`text-sm text-grey-lighter ${className}`}>
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