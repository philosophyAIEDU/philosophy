import React, { memo, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-accent-blue text-white',
    'hover:bg-blue-600 active:bg-blue-700',
    'focus:ring-accent-blue/50',
    'disabled:bg-blue-400/50 disabled:text-white/70'
  ),
  secondary: cn(
    'bg-gray-700 text-white',
    'hover:bg-gray-600 active:bg-gray-500',
    'focus:ring-gray-500/50',
    'disabled:bg-gray-600/50 disabled:text-white/70'
  ),
  outline: cn(
    'border-2 border-gray-600 text-gray-300 bg-transparent',
    'hover:bg-gray-800 hover:border-gray-500 hover:text-white',
    'focus:ring-gray-500/50',
    'disabled:border-gray-700 disabled:text-gray-600'
  ),
  danger: cn(
    'bg-red-600 text-white',
    'hover:bg-red-500 active:bg-red-700',
    'focus:ring-red-500/50',
    'disabled:bg-red-400/50 disabled:text-white/70'
  ),
  ghost: cn(
    'text-gray-400 bg-transparent',
    'hover:bg-gray-800 hover:text-white',
    'focus:ring-gray-500/50',
    'disabled:text-gray-600 disabled:hover:bg-transparent'
  ),
  success: cn(
    'bg-accent-green text-white',
    'hover:bg-green-500 active:bg-green-700',
    'focus:ring-green-500/50',
    'disabled:bg-green-400/50 disabled:text-white/70'
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2',
  xl: 'px-8 py-4 text-xl gap-3',
};

const iconSizeStyles: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      className = '',
      type = 'button',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseStyles = cn(
      'inline-flex items-center justify-center',
      'font-medium rounded-xl',
      'transition-all duration-200 ease-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-navy-dark',
      'disabled:cursor-not-allowed',
      'select-none',
      'transform active:scale-[0.98]'
    );

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2
              className={cn('animate-spin', iconSizeStyles[size])}
              aria-hidden="true"
            />
            {loadingText && <span>{loadingText}</span>}
            {!loadingText && <span className="sr-only">Loading...</span>}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className={iconSizeStyles[size]} aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className={iconSizeStyles[size]} aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default memo(Button);
