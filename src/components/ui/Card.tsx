import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'filled' | 'outlined';
  interactive?: boolean;
}

export function Card({
  children,
  variant = 'elevated',
  interactive = false,
  className,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-lg transition-all duration-200';

  const variants = {
    elevated: 'bg-surface shadow-elevation-1',
    filled: 'bg-surface-variant',
    outlined: 'bg-surface border border-outline-variant',
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer hover:shadow-elevation-2 active:shadow-elevation-1'
    : '';

  return (
    <div
      className={cn(baseStyles, variants[variant], interactiveStyles, className)}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  );
};

Card.Content = function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4 pt-0', className)} {...props}>
      {children}
    </div>
  );
};

Card.Actions = function CardActions({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('p-4 pt-0 flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </div>
  );
};
