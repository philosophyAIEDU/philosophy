import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
type SpinnerVariant = 'default' | 'primary' | 'secondary' | 'accent';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  text?: string;
  className?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const sizeStyles: Record<SpinnerSize, { spinner: string; text: string; gap: string }> = {
  sm: { spinner: 'h-4 w-4', text: 'text-sm', gap: 'gap-2' },
  md: { spinner: 'h-6 w-6', text: 'text-base', gap: 'gap-3' },
  lg: { spinner: 'h-10 w-10', text: 'text-lg', gap: 'gap-4' },
  xl: { spinner: 'h-14 w-14', text: 'text-xl', gap: 'gap-5' },
};

const variantStyles: Record<SpinnerVariant, string> = {
  default: 'text-gray-400',
  primary: 'text-accent-blue',
  secondary: 'text-gray-500',
  accent: 'text-accent-yellow',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  text,
  className = '',
  fullScreen = false,
  overlay = false,
}) => {
  const { spinner: spinnerSize, text: textSize, gap } = sizeStyles[size];

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        gap,
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative">
        {/* Glow effect */}
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-lg opacity-30',
            variant === 'primary' && 'bg-accent-blue',
            variant === 'accent' && 'bg-accent-yellow',
            variant === 'default' && 'bg-gray-400',
            variant === 'secondary' && 'bg-gray-500'
          )}
        />
        <Loader2
          className={cn(
            'animate-spin relative',
            spinnerSize,
            variantStyles[variant]
          )}
          aria-hidden="true"
        />
      </div>
      {text && (
        <p className={cn(textSize, 'text-gray-400 font-medium animate-pulse')}>
          {text}
        </p>
      )}
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={cn(
          'fixed inset-0 flex items-center justify-center z-50',
          'bg-navy-dark/95 backdrop-blur-sm'
        )}
        aria-label="Loading page"
      >
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center z-10',
          'bg-navy-card/80 backdrop-blur-sm rounded-2xl'
        )}
        aria-label="Loading content"
      >
        {content}
      </div>
    );
  }

  return content;
};

export default memo(LoadingSpinner);
