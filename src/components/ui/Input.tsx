import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  leadingIcon,
  trailingIcon,
  className,
  id,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      <div
        className={cn(
          'relative flex items-center bg-surface-variant rounded-t-md border-b-2 transition-colors duration-200',
          focused ? 'border-primary-500' : 'border-outline',
          error && 'border-error'
        )}
      >
        {leadingIcon && (
          <div className="absolute left-3 text-on-surface/50">{leadingIcon}</div>
        )}
        <div className="flex-1">
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'absolute left-0 text-sm transition-all duration-200 pointer-events-none',
                leadingIcon && 'left-10',
                focused || props.value
                  ? '-top-2.5 text-xs text-primary-500 bg-surface-variant px-1'
                  : 'top-3 text-on-surface/50'
              )}
            >
              {label}
            </label>
          )}
          <input
            id={inputId}
            className={cn(
              'w-full bg-transparent px-4 py-3 text-on-surface focus:outline-none',
              leadingIcon && 'pl-10',
              trailingIcon && 'pr-10',
              className
            )}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
        </div>
        {trailingIcon && (
          <div className="absolute right-3 text-on-surface/50">{trailingIcon}</div>
        )}
      </div>
      {(error || helperText) && (
        <p
          className={cn(
            'mt-1 text-xs px-4',
            error ? 'text-error' : 'text-on-surface/50'
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
