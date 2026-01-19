import React, { memo, forwardRef } from 'react';
import { cn } from '../../utils';

// Card Variants
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  clickable?: boolean;
  accent?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'none';
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-navy-card border border-gray-700',
  elevated: 'bg-navy-card border border-gray-700 shadow-xl shadow-black/20',
  outlined: 'bg-transparent border-2 border-gray-600',
  glass: cn(
    'bg-navy-card/80 backdrop-blur-lg',
    'border border-gray-700/50',
    'shadow-lg shadow-black/10'
  ),
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const accentStyles: Record<string, string> = {
  blue: 'border-l-4 border-l-accent-blue',
  green: 'border-l-4 border-l-accent-green',
  yellow: 'border-l-4 border-l-accent-yellow',
  red: 'border-l-4 border-l-accent-red',
  purple: 'border-l-4 border-l-purple-500',
  none: '',
};

// Card Header Component
const CardHeader = memo<CardHeaderProps>(({ children, className = '', action }) => (
  <div
    className={cn(
      'px-6 py-4 border-b border-gray-700',
      'flex items-center justify-between',
      className
    )}
  >
    <div className="font-serif font-bold text-white text-lg">{children}</div>
    {action && <div className="flex items-center gap-2">{action}</div>}
  </div>
));

CardHeader.displayName = 'CardHeader';

// Card Body Component
const CardBody = memo<CardBodyProps>(({ children, className = '' }) => (
  <div className={cn('px-6 py-4', className)}>{children}</div>
));

CardBody.displayName = 'CardBody';

// Card Footer Component
const CardFooter = memo<CardFooterProps>(({ children, className = '' }) => (
  <div
    className={cn(
      'px-6 py-4 border-t border-gray-700',
      'bg-gray-900/30',
      className
    )}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

// Main Card Component
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'none',
      hoverable = false,
      clickable = false,
      accent = 'none',
      header,
      footer,
      className = '',
      onClick,
      role,
      tabIndex,
      ...props
    },
    ref
  ) => {
    const isInteractive = hoverable || clickable || !!onClick;

    const baseStyles = cn(
      'rounded-2xl overflow-hidden',
      'transition-all duration-300 ease-out'
    );

    const interactiveStyles = isInteractive
      ? cn(
          'cursor-pointer',
          'hover:shadow-xl hover:shadow-black/20',
          'hover:border-gray-600',
          'hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-lg',
          'focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:ring-offset-2 focus:ring-offset-navy-dark'
        )
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          accentStyles[accent],
          interactiveStyles,
          className
        )}
        onClick={onClick}
        role={isInteractive ? role || 'button' : role}
        tabIndex={isInteractive ? tabIndex ?? 0 : tabIndex}
        onKeyDown={
          isInteractive && onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
                }
              }
            : undefined
        }
        {...props}
      >
        {header && <CardHeader>{header}</CardHeader>}
        {padding === 'none' ? (
          <CardBody>{children}</CardBody>
        ) : (
          children
        )}
        {footer && <CardFooter>{footer}</CardFooter>}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Compound Component Pattern
const CardComponent = Object.assign(memo(Card), {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});

export default CardComponent;
