import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  children,
  variant = 'filled',
  size = 'medium',
  icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    filled: 'bg-primary-500 text-white hover:shadow-elevation-1',
    outlined:
      'bg-transparent text-primary-500 border border-outline hover:bg-primary-50',
    text: 'bg-transparent text-primary-500 hover:bg-primary-50',
    elevated: 'bg-surface text-primary-500 shadow-elevation-1 hover:shadow-elevation-2',
    tonal: 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200',
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm rounded-full',
    medium: 'px-5 py-2.5 text-sm rounded-full',
    large: 'px-7 py-3 text-base rounded-full',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple';

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    props.onClick?.(e);
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </button>
  );
}
